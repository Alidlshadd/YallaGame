import Database from "better-sqlite3"
import { mkdirSync, existsSync, chmodSync } from "node:fs"
import path from "node:path"
import { emitKeypressEvents } from "node:readline"
import { openControlDatabase, audit } from "./database.js"
import { hashPassword, normalizeAdminUsername } from "./auth.js"
import { cleanupUploads, persistentUploads } from "./content.js"

function secretPrompt(label: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Interactive terminal required; passwords cannot be supplied in arguments, environment or pipes"
    )
  process.stdout.write(label)
  emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve, reject) => {
    let value = ""
    const finish = () => {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.off("keypress", key)
      process.stdout.write("\n")
    }
    const key = (text: string, info: { name?: string; ctrl?: boolean }) => {
      if (info.ctrl && info.name === "c") {
        finish()
        reject(new Error("Cancelled"))
        return
      }
      if (info.name === "return") {
        finish()
        resolve(value)
        return
      }
      if (info.name === "backspace") value = [...value].slice(0, -1).join("")
      else if (
        text &&
        !info.ctrl &&
        [...text].every(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127)
      )
        value += text
    }
    process.stdin.on("keypress", key)
  })
}
async function main() {
  const [command, rawUsername, ...extra] = process.argv.slice(2)
  if (
    extra.length ||
    !["backup", "migrate", "create", "password", "disable", "cleanup", "cleanup-apply"].includes(
      command ?? ""
    )
  )
    throw new Error(
      "Usage: admin:cli -- backup|migrate|create USER|password USER|disable USER|cleanup|cleanup-apply"
    )
  const filename = process.env.DB_PATH
  if (!filename || filename === ":memory:") throw new Error("Set DB_PATH to the persistent SQLite file")
  const backupDir = path.resolve(process.env.BACKUP_DIR ?? "data/backups")
  if (backupDir === path.resolve("dist") || backupDir.startsWith(path.resolve("dist") + path.sep))
    throw new Error("Backups must be outside dist")
  if (command === "backup" || command === "migrate") {
    if (rawUsername) throw new Error("Unexpected argument")
    if (existsSync(filename)) {
      mkdirSync(backupDir, { recursive: true, mode: 0o700 })
      const source = new Database(filename, { readonly: true })
      const destination = path.join(backupDir, `yallagame-${Date.now()}.db`)
      try {
        await source.backup(destination)
        chmodSync(destination,0o600)
        process.stdout.write(`Verified SQLite online backup: ${destination}\n`)
      } finally {
        source.close()
      }
      const check = new Database(destination, { readonly: true })
      try {
        if (check.pragma("integrity_check", { simple: true }) !== "ok")
          throw new Error("Backup integrity check failed")
      } finally {
        check.close()
      }
    } else if (command === "backup") throw new Error("Database does not exist")
    if (command === "migrate") {
      const db = openControlDatabase(filename, true)
      db.close()
      process.stdout.write("Additive migration complete. Existing rooms preserved.\n")
    }
    return
  }
  const db = openControlDatabase(filename)
  try {
    if (command?.startsWith("cleanup")) {
      process.stdout.write(
        JSON.stringify(
          await cleanupUploads(
            db,
            persistentUploads(process.env.UPLOAD_DIR ?? "data/uploads"),
            command !== "cleanup-apply"
          )
        ) + "\n"
      )
      return
    }
    const username = normalizeAdminUsername(rawUsername ?? "")
    const user = db.prepare("SELECT id FROM admin_users WHERE username=?").get(username) as
      | { id: number }
      | undefined
    if (command === "disable") {
      if (!user) throw new Error("Unknown admin")
      db.transaction(() => {
        db.prepare("UPDATE admin_users SET enabled=0,updated_at=? WHERE id=?").run(Date.now(), user.id)
        db.prepare("DELETE FROM admin_sessions WHERE admin_id=?").run(user.id)
        audit(db, user.id, "admin_disabled", username, { source: "local_cli" })
      })()
      return
    }
    if (command === "create" && user) throw new Error("Admin already exists")
    if (command === "password" && !user) throw new Error("Unknown admin")
    let password = await secretPrompt("New password (14–128 characters; hidden): ")
    let confirmation = await secretPrompt("Repeat password (hidden): ")
    if (password !== confirmation) throw new Error("Passwords do not match")
    const encoded = await hashPassword(password)
    password = ""
    confirmation = ""
    db.transaction(() => {
      let id = user?.id
      if (command === "create")
        id = Number(
          db
            .prepare("INSERT INTO admin_users(username,password_hash,created_at,updated_at) VALUES(?,?,?,?)")
            .run(username.toLowerCase(), encoded, Date.now(), Date.now()).lastInsertRowid
        )
      else {
        db.prepare("UPDATE admin_users SET password_hash=?,updated_at=? WHERE id=?").run(
          encoded,
          Date.now(),
          id
        )
        db.prepare("DELETE FROM admin_sessions WHERE admin_id=?").run(id)
      }
      audit(db, id!, command === "create" ? "admin_created" : "admin_password_changed", username, {
        source: "local_cli"
      })
    })()
    process.stdout.write("Admin account updated.\n")
  } finally {
    db.close()
  }
}
main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "Command failed"}\n`)
  process.exitCode = 1
})

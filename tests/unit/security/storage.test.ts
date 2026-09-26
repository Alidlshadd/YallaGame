import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { privateStoragePath } from "../../../src/server/security/storage.js"
import { openControlDatabase } from "../../../src/server/control/database.js"
import { SqliteStore } from "../../../src/server/store/sqlite-store.js"

describe("private storage boundaries", () => {
  let root: string
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "yalla-storage-security-"))
    await mkdir(path.join(root, "public"))
    await mkdir(path.join(root, "dist"))
  })
  afterEach(async () => {
    expect(path.dirname(root)).toBe(path.resolve(tmpdir()))
    expect(path.basename(root)).toMatch(/^yalla-storage-security-/)
    await rm(root, { recursive: true, force: true })
  })
  it("rejects public/build paths before creating a database or backup", () => {
    for (const candidate of ["public/rooms.db", "dist/client/backup.db", "public", "data/../public/new/rooms.db"]) {
      expect(() => privateStoragePath(path.join(root, candidate), "DB_PATH", root)).toThrow("outside dist and public")
    }
    expect(privateStoragePath(path.join(root, "data/rooms.db"), "DB_PATH", root)).toBe(path.join(root, "data/rooms.db"))
    expect(privateStoragePath(path.join(root, "publicity/rooms.db"), "DB_PATH", root)).toBe(path.join(root, "publicity/rooms.db"))
  })
  it("resolves junctions and symlinks before validating a missing child path", async () => {
    await symlink(path.join(root, "public"), path.join(root, "innocent"), process.platform === "win32" ? "junction" : "dir")
    expect(() => privateStoragePath(path.join(root, "innocent/new/rooms.db"), "DB_PATH", root)).toThrow("outside dist and public")
  })
  it("both database entry points reject a public database before opening it", () => {
    expect(() => openControlDatabase("public/never-create-security-test.db", true)).toThrow("outside dist and public")
    expect(() => new SqliteStore("dist/client/never-create-security-test.db")).toThrow("outside dist and public")
  })
})

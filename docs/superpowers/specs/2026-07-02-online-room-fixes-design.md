# Online Room Fixes: No Player Cap, Reliable Role Assignment, Admin Kick

Date: 2026-07-02
Status: Approved (user delegated final decisions)

## Problem

Reported issues in the online (room-code) mode:

1. **Special roles vanish.** Sometimes nobody at the table gets the vampire/spy role
   ("bütün köy normal oluyor", "spy yok"). Root cause: roles are assigned to *all*
   players in `room.players`, including disconnected ghosts (players who closed the
   tab stay in the list with `connected: false`). A special role can land on a ghost,
   leaving all present players with the filler role.
2. **Late joiners stay roleless.** A player who joins after "Assign Roles" gets
   `role: null` and waits forever. Re-assigning reshuffles everyone's roles.
3. **Player cap.** `MAX_PLAYERS_PER_ROOM` (25) rejects joins with `ROOM_FULL`.
   Not wanted — rooms should be unlimited.
4. **No kick.** Admin cannot remove a player (ghost or troll) from the room.

Join is already approval-free (verified); no change needed there.

## Design

### 1. Connected-only role assignment

`admin:assign-roles` operates on connected players only:

- `minPlayers` check counts `players.filter(p => p.connected)`.
- Role pool is built for the connected count.
- Shuffled roles go to connected players; disconnected players get `role: null`.
- The post-assign `player:role-assigned` broadcast loop skips players without a role
  (currently it would crash on `role!` if a role is null).

New domain function in `src/server/domain/roles.ts`:

```ts
assignRolesToConnected(players, pool, rng): Player[]
// pool.length must equal connected count; disconnected → role: null
```

The old `assignRolesToPlayers` is replaced.

### 2. Late joiner / reconnector auto-filler

In `player:join` (`src/server/sockets/player-handlers.ts`): whenever the join
resolves inside a room with `assigned === true` and the bound player has
`role: null` (fresh player, name-rebind, or id-rebind), the server assigns the
game's filler role immediately. Special role counts are untouched; nobody else
is reshuffled. The existing "emit role if assigned" block then delivers the
reveal to that player automatically.

Filler selection matches `buildRolePool`: first role with `filler: true`.

### 3. Remove the player cap

- Delete the `ROOM_FULL` check in `player:join`.
- Remove `MAX_PLAYERS_PER_ROOM` from `src/server/config.ts`, `.env.example`, README.
- Remove `ROOM_FULL` from `ErrorCode`, the client error map in `join.ts`, and the
  `errorRoomFull` i18n keys (all 4 languages).

### 4. Admin kick

New event pair:

- Client→server `admin:kick-player` `{ code, adminSecret, playerId }`
  (zod: `KickPlayerPayload = ReconnectPayload + playerId`).
- Server→client `player:kicked` (no payload).

Server handler (`admin-handlers.ts`):

1. Verify `adminSecret`; remove the player from `room.players`
   (unknown `playerId` → `INVALID_INPUT`).
2. Emit `player:kicked` to `p:${code}:${playerId}`, then make those sockets leave
   `room:${code}` and `p:${code}:${playerId}` (`io.in(...).socketsLeave(...)`) so
   they receive no further room traffic.
3. Broadcast the updated room to admin + remaining players.

Client:

- `admin.ts` `renderPlayers`: each row gets a kick button (✕) that emits
  `admin:kick-player` with the row's player id.
- `playerRoom.ts`: on `player:kicked` → clear session, clear theme, toast
  `t("kickedFromRoom")`, navigate home.
- New i18n keys in ku/ar/en/tr: `kick`, `kickedFromRoom`.
- Small CSS for the kick button next to the role label in the player row.

Kicked players may rejoin with the same name (no ban list — YAGNI).

## Not in scope

- Ban/block list.
- Who-Am-I multiple-filler distribution (separate concern).
- Reassigning a special role when its holder disconnects mid-game (admin can
  re-run Assign Roles).

## Testing

- Unit (Vitest, `tests/unit/domain/roles.test.ts` — new file):
  - pool built for connected count; disconnected players end with `role: null`;
    every special role lands on a connected player.
  - filler auto-assign helper behavior (fresh joiner into assigned room).
- Unit (existing store/domain suites must stay green).
- E2E happy-path (`tests/e2e/happy-path.spec.ts`) must stay green.
- Manual browser verification: ghost scenario (disconnect one player, assign,
  spy/vampire present among connected), late join gets filler + reveal, kick
  removes player and their screen returns home.

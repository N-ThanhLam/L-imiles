// ============================================================================
// Cloudflare Worker: L-imiles Lobby Index
// ----------------------------------------------------------------------------
// 役割: room existence index のみ。gameplay は PeerJS direct (Worker 経由しない)。
//
// エンドポイント:
//   POST /heartbeat   host が 5 秒ごとに自分の room を登録/更新
//   GET  /rooms       client が候補一覧を取得 (players desc, ts asc, 最大10件)
//
// ストレージ: in-memory Map (Worker isolate のメモリ)
//   - シンプルさ優先。isolate がしばらく live するので 5 秒 heartbeat なら実用上問題なし
//   - isolate が複数並走すると一時的に不整合が出ることがあるが、room discovery 用途では
//     5 秒後の heartbeat で自然収束するため許容
//   - 本格運用したい場合は Durable Object に移行することを推奨 (末尾コメント参照)
//
// デプロイ手順 (Cloudflare ダッシュボード):
//   1. https://dash.cloudflare.com/ にログイン
//   2. Workers & Pages → Create application → Create Worker
//   3. 名前を付けて Deploy → "Edit code" でこのファイルの内容をペースト
//   4. Deploy ボタンを押す
//   5. 表示された URL (例: https://my-lobby.xxxxx.workers.dev) を L-imiles_v4.html の
//      `const LOBBY_URL = ...` に貼り付ける (https:// を含む、末尾スラッシュなし)
//
// デプロイ手順 (wrangler CLI):
//   $ npm install -g wrangler
//   $ wrangler login
//   $ wrangler init --type=javascript my-lobby
//   $ cp worker.js my-lobby/src/index.js   (このファイルを置く)
//   $ cd my-lobby && wrangler deploy
// ============================================================================

const STALE_MS = 15000;   // 15 秒応答がない room は ghost とみなし削除
const MAX_ROOMS = 10;     // /rooms で返す最大件数

// Map<roomId, {roomCode, roomId, players, maxPlayers, spectators, started, version, ts}>
const rooms = new Map();

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    ...extra,
  };
}

function cleanupStale(now) {
  for (const [id, r] of rooms) {
    if (now - (r.ts || 0) > STALE_MS) rooms.delete(id);
  }
}

// payload の型ガード。失敗したら null。
function sanitizePayload(body) {
  if (!body || typeof body !== 'object') return null;
  if (typeof body.roomId !== 'string' || !body.roomId) return null;
  if (typeof body.roomCode !== 'string') return null;
  return {
    roomCode: String(body.roomCode).slice(0, 64),
    roomId: String(body.roomId).slice(0, 128),
    players: Number(body.players) || 0,
    maxPlayers: Number(body.maxPlayers) || 0,
    spectators: Number(body.spectators) || 0,
    started: body.started === true,
    version: typeof body.version === 'string' ? body.version.slice(0, 32) : '',
    ts: Date.now(),
  };
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // ----- CORS preflight -----
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // ----- POST /heartbeat -----
    if (path === '/heartbeat' && method === 'POST') {
      let body;
      try { body = await req.json(); }
      catch (e) {
        return new Response('bad-json', { status: 400, headers: corsHeaders() });
      }
      const r = sanitizePayload(body);
      if (!r) {
        return new Response('bad-payload', { status: 400, headers: corsHeaders() });
      }
      rooms.set(r.roomId, r);
      cleanupStale(r.ts);
      // MAX_ROOMS を超えたら最も古い (ts が小さい) ものから順に切る
      if (rooms.size > MAX_ROOMS * 2) {
        const arr = Array.from(rooms.entries()).sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0));
        const excess = rooms.size - MAX_ROOMS;
        for (let i = 0; i < excess; i++) rooms.delete(arr[i][0]);
      }
      return new Response('ok', { status: 200, headers: corsHeaders() });
    }

    // ----- GET /rooms -----
    if (path === '/rooms' && method === 'GET') {
      const now = Date.now();
      cleanupStale(now);
      // sort: players desc (人がいる部屋を優先) → ts asc (古い部屋を優先 = 集約しやすい)
      const list = Array.from(rooms.values()).sort((a, b) => {
        if (b.players !== a.players) return b.players - a.players;
        return (a.ts || 0) - (b.ts || 0);
      }).slice(0, MAX_ROOMS);
      return new Response(JSON.stringify(list), {
        status: 200,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
      });
    }

    // ----- diagnostic: GET / -----
    if (path === '/' && method === 'GET') {
      return new Response(
        'L-imiles Lobby Index\nRooms: ' + rooms.size + '\nEndpoints: POST /heartbeat, GET /rooms\n',
        { status: 200, headers: corsHeaders({ 'Content-Type': 'text/plain' }) }
      );
    }

    return new Response('not-found', { status: 404, headers: corsHeaders() });
  },
};

// ============================================================================
// 本格運用したくなったら (任意):
// ----------------------------------------------------------------------------
// in-memory Map は Worker isolate のライフサイクル次第で消える / 複数 isolate 間で
// 不整合が出る、という制約がある。10 room 程度・5 秒 heartbeat なら実用上気になら
// ないが、もし「room が時々消える」「複数 isolate でズレる」が問題になったら
// Durable Object に移行する:
//
//   - durable_objects バインディングを設定 (wrangler.toml)
//   - export class LobbyDO { fetch(req) { ... } } で同一 instance に集約
//   - rooms を this.state.storage に永続化、または Map をそのまま使う (この時は単一
//     instance に集約されるので一貫性が出る)
//
// ただし Durable Object は有料プラン (Workers Paid $5/mo) が必要。
// 無料枠で動かしたい場合はこの in-memory 版で十分。
// ============================================================================

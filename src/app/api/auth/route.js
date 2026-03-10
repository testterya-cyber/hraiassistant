export async function POST(req) {
  try {
    const { login, password } = await req.json();
    const usersEnv = process.env.USERS || "admin=demo123";
    const users = Object.fromEntries(
      usersEnv.split(",").map((u) => u.trim().split("="))
    );
    if (users[login] && users[login] === password) {
      return Response.json({ ok: true, name: login });
    }
    return Response.json({ ok: false }, { status: 401 });
  } catch {
    return Response.json({ error: "Ошибка" }, { status: 500 });
  }
}

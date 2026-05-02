export async function POST(req: Request) {
  const { message } = await req.json();

  const res = await fetch("http://localhost:1503/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message,
    }),
  });

  const data = await res.json();

  return Response.json({
    reply: data.reply,
    content: data.reply,
  });
}
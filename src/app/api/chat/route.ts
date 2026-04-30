export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1].content;

  const res = await fetch("http://localhost:1503/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: lastMessage,
    }),
  });

  const data = await res.json();

  return Response.json({
    content: data.reply,
  });
}
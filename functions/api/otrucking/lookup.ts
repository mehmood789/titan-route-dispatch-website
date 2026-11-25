
interface Env {}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const value = url.searchParams.get("value")?.trim();

  if (!value || !["mc", "dot"].includes(type || "")) {
    return Response.json(
      { error: "Please provide a valid MC or USDOT number." },
      { status: 400 }
    );
  }

  const normalizedType = type === "mc" ? "docket" : "dot";

  try {
    const apiUrl = new URL("https://chat.otrucking.com/api/carrier");
    apiUrl.searchParams.set("type", normalizedType);
    apiUrl.searchParams.set("value", value);

    const response = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return Response.json(
        { error: "Carrier lookup provider returned an error." },
        { status: 502 }
      );
    }

    const data = await response.json();

    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return Response.json(
      { error: "Carrier lookup is temporarily unavailable." },
      { status: 502 }
    );
  }
};


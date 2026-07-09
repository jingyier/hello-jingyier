export const config = {
  runtime: "edge"
};

export default function handler() {
  return Response.json(
    {
      name: "jingyier",
      status: "alive",
      updatedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}

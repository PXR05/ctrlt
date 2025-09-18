import { query } from "$app/server";
import { z } from "zod";

export const getSuggestions = query(
  z.object({ query: z.string(), url: z.string() }),
  async ({ query, url }) => {
    const response = await fetch(`${url}${query}`, {
      headers: {
        Origin: new URL(url).origin,
      },
    });
    const data = await response.json();
    if (data.length < 1) return [];
    if (url.includes("google.com")) {
      return parseGoogleSuggestions(data);
    }
    return parseGeneralSuggestions(data[1]);
  }
);

interface Suggestion {
  phrase: string;
  type: "QUERY" | "NAVIGATION";
}

function parseGoogleSuggestions(data: any): Suggestion[] {
  if (data.length < 1) return [];
  return data[1].map((phrase: string, i: number) => ({
    phrase,
    type: data[4]["google:suggesttype"][i],
  }));
}

function parseGeneralSuggestions(data: any): Suggestion[] {
  return data.map((phrase: string) => ({
    phrase,
    type: "QUERY",
  }));
}

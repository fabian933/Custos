import { afterEach, describe, expect, it, vi } from "vitest";
import { SYSTEM_PROMPT, translateQuestion } from "../lib/translate";

function mockOpenAI(content: string) {
  const fetchMock = vi.fn(
    async (_input: unknown, init?: RequestInit) =>
      new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CUSTOS_LLM_MODEL;
});

describe("translateQuestion", () => {
  it("uses the LLM translation when the call succeeds", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.CUSTOS_LLM_MODEL = "gpt-test";
    const fetchMock = mockOpenAI(
      JSON.stringify({ predicates: [{ name: "salary_below", args: { amount: 15000 } }] }),
    );

    const translation = await translateQuestion("does she earn under fifteen thousand?");
    expect(translation).toEqual({
      refuse: false,
      source: "llm",
      predicates: [{ name: "salary_below", args: { amount: 15000 } }],
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("gpt-test");
    expect(body.messages[0].content).toBe(SYSTEM_PROMPT);
  });

  it("passes an LLM refusal through", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockOpenAI(JSON.stringify({ refuse: true, reason: "raw salary requested" }));
    expect(await translateQuestion("what is her salary?")).toEqual({
      refuse: true,
      reason: "raw salary requested",
      source: "llm",
    });
  });

  it("refuses a predicate the LLM invented", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockOpenAI(JSON.stringify({ predicates: [{ name: "owns_a_boat", args: {} }] }));
    expect(await translateQuestion("does she own a boat?")).toMatchObject({
      refuse: true,
      source: "llm",
    });
  });

  it("falls back to the keyword parser when the LLM call fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("upstream is down", { status: 503 })),
    );
    expect(await translateQuestion("Is she eligible for a housing grant?")).toEqual({
      refuse: false,
      source: "fallback",
      predicates: [
        { name: "is_uae_national", args: {} },
        { name: "salary_below", args: { amount: 30000 } },
      ],
    });
  });

  it("falls back when no API key is configured", async () => {
    delete process.env.OPENAI_API_KEY;
    expect(await translateQuestion("Is this person a UAE national?")).toMatchObject({
      source: "fallback",
      refuse: false,
    });
  });
});

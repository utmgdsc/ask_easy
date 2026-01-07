import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

test("Page", () => {
  render(<Page />);

  // Sample test to check if the main heading is rendered
  // realistically this is to test the testing software
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "ASK easy with AskEasy. I'm testing GitHub actions!",
    })
  ).toBeDefined();
});

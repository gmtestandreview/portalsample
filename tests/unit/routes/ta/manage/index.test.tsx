import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaApplicationManage from "@/routes/ta/manage/index.tsx";

vi.mock("@/routes/ta/manage/appDetails", () => ({
	default: () => <div>Application details route</div>,
}));

describe("TAApplicationManage", () => {
	it("renders the application details route content", () => {
		render(<TaApplicationManage />);

		expect(screen.getByText("Application details route")).toBeInTheDocument();
	});
});

import { Button } from "react-bootstrap";
import "../../styles/media-print.scss";

import { trackGAEvent } from "../../analytics/GoogleAnalytics.tsx";
import BlockUiSpinner from "../BlockUISpinner/index.tsx";

export interface ViewPdfButtonProps {
	text?: string;
	fileSize: string;
	isLoaded: boolean;
	getPdf(): void;
	gaLabel: string;
}

/**
 * Show the quote button and open in a new tab to view the pdf
 * @param props ViewPdfQuoteProps
 * @returns jsx
 */
const ViewPdfButton = (props: ViewPdfButtonProps) => {
	const { text, fileSize, isLoaded, getPdf, gaLabel } = props;

	return (
		<div className="text-end">
			{isLoaded ? (
				<>
					<Button
						variant="secondary"
						className="ms-md-auto mb-3"
						onClick={(_e) => {
							getPdf();
							trackGAEvent(gaLabel, "download");
						}}
					>
						{text}
						<i className="icon-download ms-2" aria-hidden="true" />
					</Button>
					<span id="acrobat-note" className="d-block small">
						{"Requires Acrobat PDF reader - PDF file size "}
						{fileSize}
					</span>
				</>
			) : (
				<BlockUiSpinner partial={true}>
					<p>Loading data...</p>
				</BlockUiSpinner>
			)}
		</div>
	);
};

export default ViewPdfButton;

import type { FormikValues } from "formik";
import { useFormikContext } from "formik";
import { useState } from "react";
import PrimaryButton from "../../Buttons/PrimaryButton";
import ConfirmationModal from "../../modals/ConfirmationModal";
import countOfErrors from "../FormikForm/formikHelpers";
import SubmitFormButton from "../SubmitFormButton";
import type { NextStepButtonProps } from "./types";

const NextStepButton = ({
	steps,
	currentStepIndex,
	title,
	finalStepTitle,
	finalStepConfirmation,
	className = "", // default props
}: NextStepButtonProps) => {
	const [showModal, setShowModal] = useState(false);
	const { errors, submitForm, validateForm } = useFormikContext<FormikValues>();
	const finalStep = currentStepIndex === steps.length - 1;
	const showModalOnFinalStep = finalStep && finalStepConfirmation !== undefined;
	const modalConfirmation = showModalOnFinalStep
		? finalStepConfirmation
		: undefined;
	const isDefaultClick = !showModalOnFinalStep || countOfErrors(errors) > 0;

	const onButtonClick = async () => {
		const formErrors = await validateForm();
		if (showModalOnFinalStep && !showModal && countOfErrors(formErrors) === 0) {
			setShowModal(true);
		} else {
			submitForm();
		}
	};

	const closeModal = () => setShowModal(false);
	const onModalNo = () => {};

	return (
		<SubmitFormButton>
			{(onClick: any) => (
				<>
					{modalConfirmation ? (
						<ConfirmationModal
							closeModal={closeModal}
							isOpen={showModal}
							onModalNo={onModalNo}
							onModalYes={onClick}
							titleText={
								modalConfirmation.modalTitle ??
								modalConfirmation.titleText ??
								""
							}
							bodyText={
								modalConfirmation.modalBodyText ??
								modalConfirmation.bodyText ??
								""
							}
							noButtonTitle={modalConfirmation.noButtonTitle ?? "No"}
							yesButtonTitle={modalConfirmation.yesButtonTitle ?? "Yes"}
						/>
					) : null}

					<PrimaryButton
						type={showModalOnFinalStep ? "button" : "submit"}
						data-testid="save-and-next-button"
						onClick={isDefaultClick ? onClick : () => onButtonClick()}
						className={className}
					>
						{finalStep ? finalStepTitle || "Submit" : title || "Save and next"}
					</PrimaryButton>
				</>
			)}
		</SubmitFormButton>
	);
};

export default NextStepButton;

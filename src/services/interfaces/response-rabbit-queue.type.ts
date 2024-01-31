import { IErrorMessage } from "../../errors/error-message.interface";
import { IValidationTokenData } from "./validation-token-data.interface";
export type responseRabbitQueue = IValidationTokenData | IErrorMessage;

import { Response } from "express";

interface Message {
  code: number;
  success: boolean;
  message: string;
  data?: object;
}

interface Error {
  code: number;
  message: string;
}

const serverResponse = {
  sendSuccess: (res: Response, message: Message, data: object | null) => {
    const responseMessage: Partial<Message> = {
      code: message.code ? message.code : 500,
      success: message.success,
      message: message.message,
    };
    if (data) {
      responseMessage.data = data;
    }
    return res.status(message.code).json(responseMessage);
  },
  sendError: (res: Response, error: Error) => {
    const responseMessage = {
      code: error.code ? error.code : 500,
      success: false,
      message: error.message,
    };
    return res.status(error.code ? error.code : 500).json(responseMessage);
  },
};

export default serverResponse;

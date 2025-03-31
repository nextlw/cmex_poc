import { FastApiNCMResult } from "./globalTypes";

declare global {
  namespace Express {
    interface Request {
      fastApiResult?: FastApiNCMResult | null;
    }
  }
}

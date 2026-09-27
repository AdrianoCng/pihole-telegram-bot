import { pauseActionController } from "../controllers/pauseController.js";
import { PAUSE_ACTION_PATTERN } from "./pause.js";

export const ACTIONS = [
    {
        trigger: PAUSE_ACTION_PATTERN,
        handler: pauseActionController,
    }
]
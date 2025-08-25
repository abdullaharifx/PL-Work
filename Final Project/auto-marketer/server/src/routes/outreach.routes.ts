import { Router } from "express";
import {
  createOutreach,
  updateOutreach,
  deleteOutreach,
  getOutreach,
  getOutreaches,
  runOutreach,
} from "../controllers/outreach.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateOutreach } from "../validators/outreach.validator";

const router = Router();

// Protect all routes
router.use(requireAuth);

router.route("/").get(getOutreaches).post(validateOutreach, createOutreach);

router
  .route("/:id")
  .get(getOutreach)
  .patch(validateOutreach, updateOutreach)
  .delete(deleteOutreach);

router.post("/:id/run", runOutreach);

export default router;

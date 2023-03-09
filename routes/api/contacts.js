
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/contacts");
const { validateBody, isValidId, authenticate } = require("../../middlewares");
const {schemas} = require("../../models/contact");

router.get("/", authenticate, ctrl.getAll);

router.get("/:contactId", authenticate, isValidId, ctrl.getById);

router.post("/", authenticate, validateBody(schemas.addSchema), ctrl.add);

router.delete("/:contactId", authenticate, isValidId, ctrl.remove);

router.put("/:contactId", authenticate, validateBody(schemas.addSchema), isValidId, ctrl.update);

router.patch(
  "/:contactId/favorite", authenticate,
  validateBody(schemas.updateFavoriteSchema),
  ctrl.updateFavorite
);

module.exports = router;

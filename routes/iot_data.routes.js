const express = require("express");
// const userMiddleware = require("../middlewares/user.middleware.js");
// const userUtil = require("../utils/user.util.js");
const iotDataController = require("../controllers/iot_data.controller.js");
const { suggestACTemperature } = require("../fuzzyModel/fuzzyController.js");
const mqttcontrol = require("../controllers/mqttctrl.controller.js")

const authMiddware = require("../middlewares/auth.middleware.js");

const router = express.Router();

// router.use(authMiddware.authenticateToken);

router.get("/all-data", iotDataController.getAllIotData);

router.post("/control", mqttcontrol.awsMqttControl)

router.post("/create-iotData", iotDataController.createIotData);

router.get("/suggest-temperature", suggestACTemperature);

router.use(authMiddware.adminRoleAuth);

router.patch("/update-iotData", iotDataController.updateIotData);

router.delete("/delete-iotData", iotDataController.deleteIotData);

module.exports = router;

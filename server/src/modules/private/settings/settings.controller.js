import SettingDao from "../../../shared/dao/setting.dao.js";
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";
import Ok from "../../../shared/responses/Ok.response.js";

class SettingsController {
    constructor() { this.settingDao = new SettingDao(); }

    upsertSetting = async (req, res) => {
        const { key, value } = req.body;
        const organizationId = req.user.organizationId;

        const setting = await this.settingDao.Model.findOneAndUpdate(
            { organizationId, key: key.trim() },
            { value: value.trim() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return Ok(res, "Setting updated successfully", setting);
    }
}

export default SettingsController;

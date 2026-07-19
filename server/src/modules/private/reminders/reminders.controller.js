import reminderService from "../../../shared/services/reminder.service.js";
import Created from "../../../shared/responses/Created.response.js";
import Ok from "../../../shared/responses/Ok.response.js";

class RemindersController {

    createReminder = async (req, res) => {
        const result = await reminderService.createReminder({
            organizationId: req.user.organizationId,
            createdBy: req.user.userId || req.user._id,
            data: req.body,
        });

        return Created(res, "Reminder scheduled successfully", result);
    };

    listReminders = async (req, res) => {
        const result = await reminderService.listReminders({
            organizationId: req.user.organizationId,
            filters: req.query,
        });

        return Ok(res, "Reminders retrieved successfully", result);
    };

    getReminder = async (req, res) => {
        const reminder = await reminderService.getReminder({
            organizationId: req.user.organizationId,
            reminderId: req.params.reminderId,
        });

        return Ok(res, "Reminder retrieved successfully", reminder);
    };

    sendReminder = async (req, res) => {
        const shouldWait = req.query.wait === true || req.query.wait === "true";

        const result = shouldWait
            ? await reminderService.sendReminder({
                organizationId: req.user.organizationId,
                reminderId: req.params.reminderId,
                source: "manual",
            })
            : await reminderService.enqueueImmediateReminder({
                organizationId: req.user.organizationId,
                reminderId: req.params.reminderId,
            });

        return Ok(
            res,
            shouldWait ? "Reminder processed" : "Reminder queued for immediate delivery",
            result
        );
    };

    cancelReminder = async (req, res) => {
        const reminder = await reminderService.cancelReminder({
            organizationId: req.user.organizationId,
            reminderId: req.params.reminderId,
        });

        return Ok(res, "Reminder cancelled successfully", reminder);
    };

}

export default RemindersController;

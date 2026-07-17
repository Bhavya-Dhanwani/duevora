// Importing modules
import FinancialYearDao from "../../../shared/dao/financialYear.dao.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";
import Created from "../../../shared/responses/Created.response.js";

class FinancialYearsController {

    constructor() {
        this.financialYearDao = new FinancialYearDao();
    }

    createFinancialYear = async (req, res) => {
        const { name, startDate, endDate } = req.body;
        const organizationId = req.user.organizationId;

        // validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            throw new BadRequest("End date must be after start date.");
        }

        const financialYear = await this.financialYearDao.create({
            organizationId,
            name: name.trim(),
            startDate: start,
            endDate: end
        });

        return Created(res, "Financial year created successfully", financialYear);
    }

}

export default FinancialYearsController;

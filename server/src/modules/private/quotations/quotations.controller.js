// Importing modules
import QuotationDao from "../../../shared/dao/quotation.dao.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";
import Ok from "../../../shared/responses/Ok.response.js";

// class to handle quotation operations
class QuotationsController {

    constructor() {

        // initializing the quotation dao
        this.quotationDao = new QuotationDao();

    }

    // approve a quotation
    approveQuotation = async (req, res) => {

        const { quotationId } = req.params;
        const organizationId = req.user.organizationId;

        // finding the quotation within organization context
        const quotation = await this.quotationDao.findOne({
            _id: quotationId,
            organizationId
        });

        if (!quotation) {

            throw new NotFound("Quotation not found in your organization.");

        }

        if (quotation.status !== "draft" && quotation.status !== "sent") {

            throw new BadRequest("Only draft or sent quotations can be approved.");

        }

        // updating status of quotation to accepted
        const updatedQuotation = await this.quotationDao.updateById(quotationId, {
            status: "accepted"
        });

        return Ok(res, "Quotation approved successfully", updatedQuotation);

    }

}

export default QuotationsController;

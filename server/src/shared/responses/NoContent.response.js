// Importing modules 
import ApiReponse from "../utils/ApiResponse.util.js";
import HTTP_STATUS from "../constants/StatusCodes.constants.js";

// function to send the no content response
function NoContent(res, message) {

    // sending the response with the status code and message
    return ApiReponse(res, HTTP_STATUS.NO_CONTENT, message);

}

export default NoContent;

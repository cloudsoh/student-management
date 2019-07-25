import { Sequelize } from "../../models";
import { BulkRecordError } from "sequelize/lib/errors";

// Retrieve error messages from the Error object
function extractValidationErrorMessages(e, messages = []) {
    e.errors.forEach((error) => {
        let message;
        switch (error.validatorKey) {
            case 'isEmail':
                message = 'Please enter a valid email';
                break;
            case 'isDate':
                message = 'Please enter a valid date';
                break;
            case 'len':
                if (error.validatorArgs[0] === error.validatorArgs[1]) {
                    message = 'Use ' + error.validatorArgs[0] + ' characters';
                } else {
                    message = 'Use between ' + error.validatorArgs[0] + ' and ' + error.validatorArgs[1] + ' characters';
                }
                break;
            case 'min':
                message = 'Use a number greater or equal to ' + error.validatorArgs[0];
                break;
            case 'max':
                message = 'Use a number less or equal to ' + error.validatorArgs[0];
                break;
            case 'isInt':
                message = 'Please use an integer number';
                break;
            case 'is_null':
                message = 'Please complete this field';
                break;
            case 'not_unique':
                message = error.value + ' is taken. Please choose another one';
                error.path = error.path.replace("_UNIQUE", "");
        }
        messages[error.path] = message;
    });
    return messages;
}
function sequelizeHandler(err, req, res, next) {
    if (!err.forEach) err = [err]

    let messages = {};
    err.forEach((error) => {
        // Set the error to the 'real error' in BulkRecordError
        if (error instanceof BulkRecordError) {
            error = error.errors;
        }

        // Extract error message if it's validation error
        if (error instanceof Sequelize.ValidationError) {
            messages = extractValidationErrorMessages(error, messages);
        }
    })

    // If there's no validation error, then pass to next handler
    if (Object.keys(messages).length < 1) return next(err)

    res.status(422).send({ errors: messages })
} 
export default sequelizeHandler;
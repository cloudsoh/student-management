import { Sequelize } from "../../models";
import { BulkRecordError } from "sequelize/lib/errors";

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
    if (!err.forEach) return next(err)

    let messages = [];
    err.forEach((error) => {
        if (error instanceof BulkRecordError 
            && error.errors instanceof Sequelize.ValidationError
        ) {
            messages = extractValidationErrorMessages(error.errors, messages);
        }
    })

    if (Object.keys(messages).length < 1) return next(err)

    res.status(422).send({ messages })
} 
export default sequelizeHandler;
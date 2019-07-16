const { validationResult } = require('express-validator');

export default fn => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    return fn(req, res, next).catch(next)
};
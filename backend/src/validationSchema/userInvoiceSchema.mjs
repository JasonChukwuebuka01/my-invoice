export const invoiceSchema = {

    'client.name': {
        notEmpty: {
            errorMessage: 'Client name is required'
        }
    },
    'client.email': {
        isEmail: {
            errorMessage: 'Invalid client email'
        }
    },
    'client.address': {
        notEmpty: {
            errorMessage: 'Client address is required'
        }
    },

    items: {
        isArray: {
            options: {
                min: 1
            },
            errorMessage: 'At least one item is required'
        }
    },
    'items.*.description': {
        notEmpty: {
            errorMessage: 'Item description is required'
        }
    },
    'items.*.quantity': {
        isInt: {
            options: {
                min: 1
            }
        }, errorMessage: 'Quantity must be at least 1'
    },
    'items.*.rate': {
        isFloat: {
            options: {
                min: 0
            }
        }, errorMessage: 'Rate must be a positive number'
    }


}

<?php
/**
 * Utilidad para validaciones de datos
 * Funciones para validar campos comunes
 */

/**
 * Valida que un campo no esté vacío
 */
function isRequired($value) {
    return !empty(trim((string)$value));
}

/**
 * Valida que un campo sea un email válido
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valida que un campo sea un número
 */
function isNumeric($value) {
    return is_numeric($value);
}

/**
 * Valida que un campo sea un número entero positivo
 */
function isPositiveInt($value) {
    return is_numeric($value) && $value > 0 && $value == (int)$value;
}

/**
 * Valida que un campo sea un número decimal positivo
 */
function isPositiveDecimal($value) {
    return is_numeric($value) && $value >= 0;
}

/**
 * Valida que un campo tenga una longitud mínima
 */
function hasMinLength($value, $min) {
    return strlen((string)$value) >= $min;
}

/**
 * Valida que un campo tenga una longitud máxima
 */
function hasMaxLength($value, $max) {
    return strlen((string)$value) <= $max;
}

/**
 * Valida que un campo tenga una longitud exacta
 */
function hasExactLength($value, $length) {
    return strlen((string)$value) === $length;
}

/**
 * Valida que un campo sea una fecha válida
 */
function isValidDate($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

/**
 * Valida que un campo sea un teléfono válido (solo para México)
 */
function isValidPhone($phone) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    return strlen($phone) === 10 && preg_match('/^[0-9]{10}$/', $phone);
}

/**
 * Valida que un campo sea un código postal válido (México)
 */
function isValidPostalCode($code) {
    return preg_match('/^[0-9]{5}$/', $code);
}

/**
 * Valida que un campo sea una URL válida
 */
function isValidUrl($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

/**
 * Valida que un campo esté en un array de valores permitidos
 */
function isInArray($value, $allowedValues) {
    return in_array($value, $allowedValues);
}

/**
 * Valida un array de datos con reglas definidas
 * 
 * @param array $data Datos a validar
 * @param array $rules Reglas por campo
 * @return array ['valid' => bool, 'errors' => array]
 */
function validateData($data, $rules) {
    $errors = [];
    
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        $fieldRules = explode('|', $rule);
        
        foreach ($fieldRules as $singleRule) {
            // Verificar si la regla tiene parámetros (ej: min:6)
            $ruleParts = explode(':', $singleRule);
            $ruleName = $ruleParts[0];
            $ruleParam = $ruleParts[1] ?? null;
            
            switch ($ruleName) {
                case 'required':
                    if (!isRequired($value)) {
                        $errors[$field] = "El campo $field es requerido";
                    }
                    break;
                case 'email':
                    if (isRequired($value) && !isValidEmail($value)) {
                        $errors[$field] = "El campo $field debe ser un email válido";
                    }
                    break;
                case 'numeric':
                    if (isRequired($value) && !isNumeric($value)) {
                        $errors[$field] = "El campo $field debe ser un número";
                    }
                    break;
                case 'positive_int':
                    if (isRequired($value) && !isPositiveInt($value)) {
                        $errors[$field] = "El campo $field debe ser un número entero positivo";
                    }
                    break;
                case 'positive_decimal':
                    if (isRequired($value) && !isPositiveDecimal($value)) {
                        $errors[$field] = "El campo $field debe ser un número mayor o igual a 0";
                    }
                    break;
                case 'min':
                    if (isRequired($value) && !hasMinLength($value, (int)$ruleParam)) {
                        $errors[$field] = "El campo $field debe tener al menos $ruleParam caracteres";
                    }
                    break;
                case 'max':
                    if (isRequired($value) && !hasMaxLength($value, (int)$ruleParam)) {
                        $errors[$field] = "El campo $field debe tener máximo $ruleParam caracteres";
                    }
                    break;
                case 'phone':
                    if (isRequired($value) && !isValidPhone($value)) {
                        $errors[$field] = "El campo $field debe ser un teléfono válido (10 dígitos)";
                    }
                    break;
                case 'postal':
                    if (isRequired($value) && !isValidPostalCode($value)) {
                        $errors[$field] = "El campo $field debe ser un código postal válido (5 dígitos)";
                    }
                    break;
            }
        }
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors
    ];
}
?>
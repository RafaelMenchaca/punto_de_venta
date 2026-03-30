import { BadRequestException, type ValidationError } from '@nestjs/common';

type SerializedValidationError = {
  field: string;
  messages: string[];
};

function translateConstraintMessage(message: string) {
  const normalizedMessage = message.trim();

  if (/should not exist/i.test(normalizedMessage)) {
    return 'Campo no permitido.';
  }

  if (/must be a UUID/i.test(normalizedMessage)) {
    return 'Debe ser un identificador valido.';
  }

  if (/must be a number/i.test(normalizedMessage)) {
    return 'Debe ser un numero valido.';
  }

  if (/must be a string/i.test(normalizedMessage)) {
    return 'Debe ser un texto valido.';
  }

  if (/must be an array/i.test(normalizedMessage)) {
    return 'Debe ser una lista valida.';
  }

  if (/must be one of the following values/i.test(normalizedMessage)) {
    return 'Debe usar uno de los valores permitidos.';
  }

  if (/must not be less than/i.test(normalizedMessage)) {
    return 'Debe ser mayor o igual al minimo permitido.';
  }

  return normalizedMessage;
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): SerializedValidationError[] {
  return errors.flatMap((error) => {
    const currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const ownErrors =
      error.constraints && Object.keys(error.constraints).length > 0
        ? [
            {
              field: currentPath,
              messages: Object.values(error.constraints).map(
                translateConstraintMessage,
              ),
            },
          ]
        : [];

    const childErrors = error.children?.length
      ? flattenValidationErrors(error.children, currentPath)
      : [];

    return [...ownErrors, ...childErrors];
  });
}

export function buildValidationException(errors: ValidationError[]) {
  return new BadRequestException({
    message: 'Los datos enviados no son validos.',
    errorCode: 'VALIDATION_ERROR',
    errors: flattenValidationErrors(errors),
  });
}

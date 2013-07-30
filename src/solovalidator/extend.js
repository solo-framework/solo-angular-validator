/**
 * Расширение встроенных методов валидатора
 *
 */
angular.extend(new Validators().fn, {

	extend: function (ctx, val, scope, elem, attrs, ctrl, args)
	{
		var invalid = val !== "extend";
		return ctx.composeAnswer("extend", ctrl, invalid, "Напишите в поле 'extend'");
	}
});

/**
 * Переопределение сообщений методов
 */
angular.extend(new Validators().messages, {

	MESSAGE_REQUIRED: "Это поле для нас очень важно, заполните его пожалуйста!"
});

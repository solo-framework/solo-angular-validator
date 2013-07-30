/**
 * Описание методов валидации.
 */

function Validators(http)
{
	this.http = http;

	if (typeof arguments.callee.instance=='undefined')
	{
		arguments.callee.instance = new function()
		{
			/**
			 * Добавим возможность форматирования строк, напр.: "value: {0}".format(100)
			 * @returns string
			 */
			String.prototype.format = function()
			{
				var formatted = this;
				for (var arg in arguments)
					formatted = formatted.replace("{" + arg + "}", arguments[arg]);

				return formatted;
			};

			function isEmpty(value)
			{
				return isUndefined(value) || value === '' || value === null || value !== value;
			}

			function isUndefined(value)
			{
				return typeof value == 'undefined';
			}

			var messages = this.messages = {
				MESSAGE_REQUIRED: "Обязательное поле"
				, MESSAGE_MAX: "Слишком большое значение"
				, MESSAGE_MIN: "Слишком маленькое значение"
				, MESSAGE_MAXLENGTH: "Слишком длинное значение"
				, MESSAGE_MINLENGTH: "Слишком короткое значение"
				, MESSAGE_INT: "Введите целое число"
				, MESSAGE_NUMBER: "Введите число"
				, MESSAGE_REMOTE: "Некорректное значение {0}"
				, MESSAGE_REMOTE_ERROR: "При проверке значения произошла ошибка"
				, MESSAGE_MATCH: "Неодинаковые значения"
				, MESSAGE_URL: "Некорректный URL"
				, MESSAGE_EMAIL: "Некорректный адрес электронной почты"
				, MESSAGE_REGEXP: "Значение не соответствует шаблону"

			};


			var http = null;

			/**
			 * Список методов, применяемых для валидации
			 *
			 * @type {{required: Function, max: Function, min: Function, int: Function, number: Function, remote: Function, match: Function, url: Function, email: Function}}
			 */
			this.fn = {



				/**
				 * Обязательное поле типа radio
				 *
				 */

				/* example
				 <div a:val="requiredRadio" name="radioName" ng-model="model.rad">
					 <input type="radio" id="radio1" name="myRadio" ng-model="model.rad" value="r1" />r1
					 <input type="radio" id="radio2" name="myRadio" ng-model="model.rad" value="r2" />r2
					 <input type="radio" id="radio3" name="myRadio"  ng-model="model.rad" value="r3" />r3
					 <div ng-show="myForm.radioName.$showError" class="error"><[myForm.radioName.$errorMessage]></div>
				 </div>
				 */

				requiredRadio: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var checked = false;
					var radios = elem.find("input");
					var len = radios.length;

					for (var i = 0; i < len; i++)
					{
						if (radios[i].type !== "radio")
							continue;

						if (radios[i].checked)
						{
							checked = true;
							break;
						}
					}

					return ctx.composeAnswer("required", ctrl, !checked, messages.MESSAGE_REQUIRED);
				},

				/**
				 * Поле должно обязательно иметь значение
				 */
				required: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var customMessage = attrs.soloValidatorRequiredMessage;
					if (attrs.type == "radio")
					{
						return ctx.composeAnswer("required", ctrl, isEmpty(val), customMessage || messages.MESSAGE_REQUIRED);
					}
					if (attrs.type == "checkbox")
					{
						return ctx.composeAnswer("required", ctrl, !ctrl.$viewValue, customMessage || messages.MESSAGE_REQUIRED);
					}
					else
					{
						return ctx.composeAnswer("required", ctrl, isEmpty(val), customMessage || messages.MESSAGE_REQUIRED);
					}
				},

				/**
				 * Числовое значение не должно превышать указанную величину
				 */
				max: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var customMessage = attrs.soloValidatorMaxMessage;
					var invalid = parseFloat(val) > parseFloat(args);
					return ctx.composeAnswer("max", ctrl, invalid, messages.MESSAGE_MAX);
				},

				/**
				 * Числовое значение не должно быть меньше указанной величины
				 */
				min: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var customMessage = attrs.soloValidatorMinMessage;
					var invalid = parseFloat(val) < parseFloat(args);
					return ctx.composeAnswer("min", ctrl, invalid, customMessage || messages.MESSAGE_MIN);
				},

				/**
				 * Значение не должно превышать указанную длину
				 */
				maxLength: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var invalid = val.length > args;
					return ctx.composeAnswer("maxLength", ctrl, invalid, messages.MESSAGE_MAXLENGTH);
				},
				/**
				 * Значение не должно быть меньше указанную длину
				 */
				minLength: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var invalid = val.length < args;
					return ctx.composeAnswer("minLength", ctrl, invalid, messages.MESSAGE_MINLENGTH);
				},


				/**
				 * Значение должно быть целым числом
				 */
				int: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					function isInt(n) {
						return parseFloat(n) == parseInt(n, 10) && !isNaN(n);
					}
					var invalid = !isInt(val);
					return ctx.composeAnswer("int", ctrl, invalid, messages.MESSAGE_INT);
				},

				/**
				 * Значение должно быть числом
				 */
				number: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					function isNumber(n) {
						return !isNaN(parseFloat(n)) && isFinite(n);
					}
					var invalid = !isNumber(val);
					return ctx.composeAnswer("int", ctrl, invalid, messages.MESSAGE_NUMBER);
				},

				/**
				 * Проверка значения на сервере
				 */
				remote: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					return ctx.http({
						method: "GET",
						url: args + "?" + ctrl.$name + "="+ encodeURIComponent(val),
						headers: {'Content-Type': 'application/x-www-form-urlencoded'}
						//data: { 'ctrl' : val }
					})

//					return ctx.http.get(args)
						.success(function(data, status){
							return ctx.composeAnswer("remote", ctrl, data != "true", messages.MESSAGE_REMOTE.format(val));
						})
						.error(function(data, status){
							return ctx.composeAnswer("remote", ctrl, true,  messages.MESSAGE_REMOTE_ERROR);
						});
				},

				/**
				 * Проверка на совпадение значений двух полей
				 */
				match: function (ctx, val, scope, elem, attrs, ctrl, args)
				{

					var firstInput = elem.inheritedData("$formController")[args];
					var invalid = null;

					if (isEmpty(firstInput.$viewValue) && isEmpty(val))
						invalid = false;
					else
						invalid = firstInput.$viewValue != val;

					firstInput.$parsers.push(function(value){
						ctx.composeAnswer("match", ctrl, firstInput.$viewValue != val, messages.MESSAGE_MATCH);
					});

					return ctx.composeAnswer("match", ctrl, invalid, messages.MESSAGE_MATCH);
				},

				/**
				 * Проверка URL
				 */
				url: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var invalid = false;
					if (!isEmpty(val))
					{
						var re =/^((https?|ftp):\/\/)?(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
						invalid = !re.test(val);
					}
					return ctx.composeAnswer("url", ctrl, invalid, messages.MESSAGE_URL);
				},

				/**
				 * Проверка e-mail
				 */
				email: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var invalid = false;
					if (!isEmpty(val))
					{
						var re =/^(([A-Za-z0-9]+_+)|([A-Za-z0-9]+\-+)|([A-Za-z0-9]+\.+)|([A-Za-z0-9]+\++))*[A-Za-z0-9+\-]+@((\w+\-+)|(\w+\.))*\w{1,63}\.[a-zA-Z]{2,6}$/i
						invalid = !re.test(val);
					}
					return ctx.composeAnswer("email", ctrl, invalid, messages.MESSAGE_EMAIL);
				},

				/**
				 * Проверка по шаблону
				 */
				regex: function (ctx, val, scope, elem, attrs, ctrl, args)
				{
					var parsed = args.match(/^\/(.*)\/([gim]*)$/);
					var re = null;
					if (parsed)
						re = new RegExp(parsed[1], parsed[2]);
					else
						throw Error("Method 'regex': expected pattern is not regular expression {0}".format(args));

					var invalid = false;
					var message = messages.MESSAGE_REGEXP;
					if (!isEmpty(val))
					{
						try
						{
							re = new RegExp(parsed[1], parsed[2]);
							invalid = !re.test(val);
						}
						catch (e)
						{
							invalid = true;
							message = e.message;
						}
					}
					return ctx.composeAnswer("regex", ctrl, invalid, message);
				}
			};

			this.composeAnswer = function(methodName, ctrl, invalid, message)
			{
				if (invalid)
				{
					ctrl.$setValidity(methodName, false);
					ctrl.$errorMessage = message;
					ctrl.$showError = true && !ctrl.$pristine;
					return false;
				}
				else
				{
					ctrl.$setValidity(methodName, true);
					ctrl.$errorMessage = message;
					ctrl.$showError = false;
				}
				return true;
			};

			this.call = function(name, val, scope, elem, attrs, ctrl, args)
			{
				if (!this.fn.hasOwnProperty(name))
					throw Error("Validator's method doesn't exist: " + name);
				var method = this.fn[name];
				return method(this, val, scope, elem, attrs, ctrl, args);
			};

			this.setHTTP = function (http)
			{
				this.http = http;
			}
		};
	}

	return arguments.callee.instance;
}
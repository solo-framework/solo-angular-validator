/**
 * Created with JetBrains PhpStorm.
 * User: afi
 * Date: 26.07.13
 * Time: 16:35
 * To change this template use File | Settings | File Templates.
 */

(function () {
	angular.module("solo.validation", [])

		.directive("soloValidator", ['$http', function($http){
			return {
				require: '?ngModel',
				link: function (scope, elem, attrs, ctrl) {

					if (!ctrl) return;

					var validators = new Validators();
					validators.setHTTP($http);

					// методы валидации, указанные в директиве
					var methods = attrs.soloValidator.split(",");

					var validatorFn = function(val)
					{
						for (var i in methods)
						{
							var methodName = methods[i].replace(/^\s+|\s+$/g,'');

							if ("" == methodName)
								continue;

							var method = null;
							var res = null;
							var parts = methodName.split("=");

							// у метода заданы параметры
							if (parts.length > 1)
							{
								methodName = parts[0];
								var args = parts[1];
								res = validators.call(methodName, val, scope, elem, attrs, ctrl, args);
							}
							else
							{
								//name, val, scope, elem, attrs, ctrl, args
								res = validators.call(methodName, val, scope, elem, attrs, ctrl);
							}

							if (!res)
								return false;
						}
					};

					ctrl.$parsers.unshift(function(value) {
						validatorFn(value);
					});

					ctrl.$formatters.push(function(value) {
						validatorFn(value);
					});

//					attrs.$observe('soloValidator', function() {
//						validatorFn(ctrl.$viewValue);
//					});
				}
			};
		}])

		.directive("soloFormValidator", function(){
			return {
				require: '?ngModel',
				link: function (scope, elem, attrs, ctrl) {

					console.log(elem);

					//elem.addEventListener("submit", function(e){ alert (1); return false; });
					//elem.submit = function(){alert (1); return false;};

					elem.bind("submit", function(e, v){

						console.log(e);
						e.stopImmediatePropagation();
						return false;
						var valid = new Validators(null);

						var res = valid.showErrorMessages();
						console.log(res);
						//return !res;
						return false;
					});


				}
			};
		})
}());
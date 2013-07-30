/**
 * Создание нового Angular приложения с заданными настройками
 *
 * @param appName
 * @param modules
 * @constructor
 */

var AppFactory = function(appName, modules)
{
	'use strict';
	angular.module(appName, modules).config([
		"$interpolateProvider", function($interpolateProvider){
			$interpolateProvider.startSymbol('<[');
			$interpolateProvider.endSymbol(']>');
		}
	]);
};
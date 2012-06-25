window.lon = window.lon || {};
lon.mim = lon.mim || {};

lon.mim.Main = new function () {
	// Private stuff
	
	// Public stuff
	return {
		initialize: function () {
			var o = this;
			
			// Set up tab actions
			$('#tabs li').click(function(event){
				var id = $(this).attr("id");
				o.switchTab(id);
			});
		},
		switchTab: function (tabId) {
			$('#tabs')
				.find('li').removeClass('active').end()
				.find('li#'+tabId).addClass('active');
			
			$('.container').hide();
			$('#'+tabId+"-tab").show();
		}
	}
}();

lon.mim.Options = new function () {
	// private stuff
	var optiontab = null;
	// public stuff returned
	return {
		initialize: function () {
			var o = this;
			
			optiontab = $('#options-tab');
			
			$('button.new', optiontab).click(function () {	o.newOption(); });
			$('button.save', optiontab).click(function () { o.saveOptions();});
			
			$('.list', optiontab).on('click', 'button.del', function (event) {
				o.deleteOption(this);
			});
			
			this.restoreOptions();
		},
		newOption: function () {
			$('#templates .entry').clone().appendTo($('.list', optiontab));
		},
		deleteOption: function (btn) {
			$(btn).parent('.entry').remove();
		},
		saveOptions: function () {
			var o = this;
			var options = [];
			
			$('.entry', optiontab).each(function (index, entry) {
				var elem = $(entry);
				var source = $('.source', elem).val();
				var replace = $('.replace', elem).val();
				if (source && replace) {
					options.push([source, replace, $('.toggle', elem).prop('checked')]);
				}
			});
			
			localStorage["mim_options"] = JSON.stringify(options);
			
			$(document).trigger('options.changed', [ options ]);
			
			$('.status', optiontab).html("Options Saved.").fadeIn('slow');
				setTimeout(function() {
					$('.status').fadeOut();
			}, 2000);
		},
		restoreOptions: function () {
			var min_options = localStorage["mim_options"];
			if (!min_options) {
				return;
			}
			
			var options = JSON.parse(min_options);
			$.each(options, function(indx, elem) {
				var entry = $('#templates .entry').clone().appendTo($('.list', optiontab));
				$('.source', entry).val(elem[0]);
				$('.replace', entry).val(elem[1]);
				$('.toggle', entry).prop('checked', elem[2]);
			});
			
			$(document).trigger('options.changed', [ options ]);
		}
	}
}();


lon.mim.Monitor = new function () {
	// Private stuff
	var options = [];
	var monitorLog = null;
	// Public stuff
	return {
		initialize: function () {
			var o = this;
			
			this.registerListener();
			
			monitorLog = $('#monitor-tab .list');
			
			$('#monitor-tab button.clear').click(function () {
				o.clearLog();
			});
			
			$(document).on('options.changed', function (event, data) {
				o.updateOptions(data);
			});
		},
		registerListener: function () {
			var monitorLog = $('#monitor-tab .list');
			var o = this;
			
			// Register web request
			chrome.webRequest.onBeforeRequest.addListener(function(info) {
				
				var logs = [], finalRequest = null;
				for ( var int = 0; int < options.length; int++) {
					var elem = options[int];
					if (info.url.indexOf(elem[0]) !== -1) {
						var log = {
							"origin": finalRequest || info.url,
							"matcher": elem
						};
						
						finalRequest = (finalRequest || info.url).replace(elem[0], elem[1]);
						
						log.result = finalRequest;
						logs.push(log);
					}
				}
				
				if (finalRequest) {
					o.displayLogging(logs);
					
					return { redirectUrl : finalRequest	};
				}
			},
			// filters
			{
				urls : [ "*://*.westjet.com/*", "*://*.softvoyage.com/*" ]
			},
			// extraInfoSpec
			[ "blocking" ]);
		},
		displayLogging: function (logs) {
			
			$.each(logs, function(indx, log) {
				$('#templates .request-log').clone()
					.find('.origin').html(log.origin).end()
					.find('.result').html(log.result).end()
					.find('.source').html(log.matcher[0]).end()
					.find('.replace').html(log.matcher[1]).end()
					.appendTo($('#monitor-tab .list'));
			});
		},
		updateOptions: function (data) {
			options = [];
			$.each(data, function (indx, elem) {
				if (!!elem[2]) {
					//options.push([new RegExp(elem[0]), elem[1]]);
					options.push([elem[0], elem[1]]);
				}
			});
		},
		clearLog: function () {
			monitorLog.empty();
		}
	}
}();

// Initialization
$(function () {
	
	// Set up main page
	lon.mim.Main.initialize();
	
	// Set up monitor
	lon.mim.Monitor.initialize();
	
	// Set up options page
	lon.mim.Options.initialize();
	
});
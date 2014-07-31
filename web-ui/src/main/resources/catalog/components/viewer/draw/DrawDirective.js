(function() {
  goog.provide('gn_draw_directive');

  var module = angular.module('gn_draw_directive', [
  ]);

  /**
   * @ngdoc directive
   * @name gn_wmsimport_directive.directive:gnWmsImport
   *
   * @description
   * Panel to load WMS capabilities service and pick layers.
   * The server list is given in global properties.
   */
  module.directive('gnDraw', [
    'goDecorateInteraction',
    function(goDecorateInteraction) {
      return {
        restrict: 'A',
        replace: false,
        templateUrl: '../../catalog/components/viewer/draw/' +
            'partials/draw.html',
        scope: {
          map: '=',
          vector: '='
        },
        link: function (scope, element, attrs) {
          var map = scope.map;
          var source = new ol.source.Vector();

          var txtStyleCache = {};
          var featureStyle = new ol.style.Style({
            fill: new ol.style.Fill({
              color: 'rgba(255, 255, 255, 0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: '#ffcc33',
              width: 2
            }),
            image: new ol.style.Circle({
              radius: 7,
              fill: new ol.style.Fill({
                color: '#ffcc33'
              })
            })
          });

          var textStyleCfg = {
            fill: {
              color: 'rgba(255, 255, 255, 0.6)'
            },
            stroke: {
              color: '#319FD3',
              width: 1
            },
            text: {
              font: '14px Calibri,sans-serif',
              fill: {
                color: '#000'
              },
              stroke: {
                color: '#fff',
                width: 3
              }
            }
          };

          var textFeatStyleFn = function(resolution) {
            var text = this.get('name');
            if (!txtStyleCache[text]) {
              txtStyleCache[text] = [new ol.style.Style({
                fill: new ol.style.Fill({
                  color: textStyleCfg.fill.color
                }),
                stroke: new ol.style.Stroke({
                  color: textStyleCfg.stroke.color,
                  width: textStyleCfg.stroke.width
                }),
                text: new ol.style.Text({
                  font: textStyleCfg.text.font,
                  text: text,
                  fill: new ol.style.Fill({
                    color: textStyleCfg.text.fill.color
                  }),
                  stroke: new ol.style.Stroke({
                    color: textStyleCfg.text.stroke.color,
                    width: textStyleCfg.text.stroke.width
                  })
                })
              })];
            }
            return txtStyleCache[text];
          };

          var drawTextStyleFn = function(feature, resolution) {
            return [new ol.style.Style({
              fill: new ol.style.Fill({
                color: textStyleCfg.fill.color
              }),
              stroke: new ol.style.Stroke({
                color: textStyleCfg.stroke.color,
                width: textStyleCfg.stroke.width
              }),
              text: new ol.style.Text({
                font: textStyleCfg.text.font,
                text: scope.text,
                fill: new ol.style.Fill({
                  color: textStyleCfg.text.fill.color
                }),
                stroke: new ol.style.Stroke({
                  color: textStyleCfg.text.stroke.color,
                  width: textStyleCfg.text.stroke.width
                })
              })
            })];
          };

          var vector = new ol.layer.Vector({
            source: source,
            style: featureStyle
          });
          scope.vector = vector;

          var onDrawend = function() {
            scope.$apply();
          };

          var drawPolygon = new ol.interaction.Draw(({
                type: 'Polygon',
                source: source
              }));
          drawPolygon.on('drawend', onDrawend);
          goDecorateInteraction(drawPolygon, map);
          scope.drawPolygon = drawPolygon;

          var drawPoint = new ol.interaction.Draw(({
                type: 'Point',
                source: source
              }));
          drawPoint.on('drawend', onDrawend);
          goDecorateInteraction(drawPoint, map);
          scope.drawPoint = drawPoint;

          var drawLine = new ol.interaction.Draw(({
                type: 'LineString',
                source: source
              }));
          drawLine.on('drawend', onDrawend);
          goDecorateInteraction(drawLine, map);
          scope.drawLine = drawLine;

          var drawText = new ol.interaction.Draw(({
            type: 'Point',
            source: source,
            style: drawTextStyleFn
          }));
          drawText.on('drawend', function(evt) {
            evt.feature.set('name',scope.text);
            evt.feature.setStyle(textFeatStyleFn);
            onDrawend();
          });
          goDecorateInteraction(drawText, map);
          scope.drawText = drawText;

          var select = new ol.interaction.Select();
          var modify = new ol.interaction.Modify({
            features: select.getFeatures()
          });

          var deleteF = new ol.interaction.Select();
          deleteF.getFeatures().on('add',
              function(evt) {
                vector.getSource().removeFeature(evt.element);
                this.clear();
                scope.$apply();
              });
          goDecorateInteraction(deleteF, map);
          scope.deleteF = deleteF;

          Object.defineProperty(scope, 'modifying', {
            get: function () {
              return (map.getInteractions().getArray().indexOf(select) >= 0 &&
                  map.getInteractions().getArray().indexOf(modify) >= 0);
            },
            set: function (val) {
              if (val) {
                map.addInteraction(select);
                map.addInteraction(modify);
              } else {
                map.removeInteraction(select);
                map.removeInteraction(modify);
                select.getFeatures().clear();
              }
            }
          });

          Object.defineProperty(vector, 'inmap', {
            get: function() {
              return map.getLayers().getArray().indexOf(vector) >= 0;
            },
            set: function(val) {
              if (val) {
                map.addLayer(vector);
              } else {
                drawPolygon.active = false;
                drawPoint.active = false;
                drawLine.active = false;
                drawText.active = false;
                deleteF = false;
                scope.modifying = false;
              }
            }
          });
        }
      }
    }]);
})();

import {GeometryUtils, IDBroker} from '../utils/export';

const TYPE_2_COLOR = {
  walls: 'rgba(255,0,0, 0.5)',
  doors: 'rgba(0,255,0, 0.5)',
  entrance_doors: 'rgba(0,124,207, 0.5)',
  windows: 'rgba(0,0,255, 0.5)',
  columns: 'rgba(128,0,0, 0.5)',
  shafts: 'rgba(125,125,125, 0.5)',
  railings: 'rgba(128,0,128, 0.5)',
  stairs: 'rgba(145,209,126, 0.5)',
  kitchens: 'rgba(255,255,0, 0.5)',
  toilets: 'rgba(0,255,255, 0.5)',
  bathtubs: 'rgba(255,0,255, 0.5)',
  showers: 'rgba(192,126,24, 0.5)',
  sinks: 'rgba(0,128,0, 0.5)',
  elevators: 'rgba(73,52,0, 0.5)',
  office_seats: 'rgba(72,142,142, 0.5)',
  area_splitter: 'rgba(0,0,0, 0.5)',  
}

class Converter {
  static parse(project) {
    const { data: annotations, ...rest } = project;
    const { walls, windows, ...restAnnotations } = annotations;

    const items = Object.entries(restAnnotations).reduce((acc, [name, annotation], index) => {
      const item = annotation.reduce((acc2, [x, y, height, width, angle], valueIndex) => {
        const id = IDBroker.acquireID();
        return {
          ...acc2,
          [id]: {
            id: id,
            misc: {},
            name: name,
            properties: {
              color: TYPE_2_COLOR[name],
              width: {
                length: width,
                unit: 'cm'
              },
              height: {
                length: 100,
                unit: 'cm'
              },
              depth: {
                length: height,
                unit: 'cm'
              }
            },
            prototype: 'items',
            selected: false,
            type: 'shower',
            visible: true,

            x,
            y: project.height - y,
            rotation: -(angle + 90), // the origin is the bottom-left vertex so we should rotate on -90 degrees
          },
        }
      }, {});

      return { ...acc, ...item }
    }, {});

    let vertices = {};
    const lines = (annotations.walls || []).reduce((acc, [x, y, thickness, distance, angle]) => {
      const lineId = IDBroker.acquireID();
      const verticesIds = [IDBroker.acquireID(), IDBroker.acquireID()];

      const sign = Math.sign(angle);
      const x1 = sign >= 0 ? x + (thickness/2) : x - (thickness/2);
      const y1 = angle >= 0 ? project.height - y - (thickness/2) : project.height - y;

      vertices = {
        ...vertices,
        [verticesIds[0]]: {
          id: verticesIds[0],
          areas: [],
          lines: [lineId],
          misc: {},
          name: 'Vertex',
          prototype: 'vertices',
          selected: false,
          type: '',
          visible: true,
          x: x1,
          y: y1,
        },
        [verticesIds[1]]: {
          id: verticesIds[1],
          areas: [],
          lines: [lineId],
          misc: {},
          name: 'Vertex',
          prototype: 'vertices',
          selected: false,
          type: '',
          visible: true,
          ...GeometryUtils.vertexBasedOnOtherVertexDistanceAndAngle(x1, y1, distance, -(angle + 90))
        },
      }

      return {
        ...acc,
        [lineId]: {
          id: lineId,
          holes: [],
          mics: {},
          name: 'Wall',
          properties: {
            height: {length: 300},
            thickness: {length: thickness, _length: thickness, _unit: 'cm'},
            textureA: 'bricks',
            textureB: 'bricks',
          },
          prototype: 'lines',
          selected: false,
          type: 'wall',
          vertices: verticesIds,
          visible: true,
        }
      }
    }, {})

    console.log(lines, vertices)

    const layers = {
      'layer-1': {
        altitude: 0,
        areas: {},
        holes: {},
        id: 'layer-1',
        items: items,
        lines: lines,
        name: 'default',
        opacity: 1,
        order: 0,
        selected: {
          areas: [],
          holes: [],
          items: [],
          lines: [],
          verices: [],
        },
        vertices: vertices,
        visible: true
      }
    };

    return { layers, ...rest };
  }

  static serialize(project) {
    return { data: {}, ...project }
  }
}

export default Converter;
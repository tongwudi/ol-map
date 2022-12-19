// 半径计算
export const getRadius = (radius) => {
  let metersPerUnit = map.getView().getProjection().getMetersPerUnit()
  let circleRadius = radius / metersPerUnit
  return circleRadius
}

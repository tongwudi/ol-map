<template>
  <div class="section">
    <span class="click-active alarm-region" @click="alarmRegionClick"></span>
    <span class="click-active alarm-icon1"></span>
    <span class="click-active alarm-icon2"></span>

    <!-- 弹框-报警模块 -->
    <m-dialog
      className="region-dialog"
      title="报警模块"
      :visible.sync="alarmModuleShow"
    >
      <el-row type="flex" class="dialog-operation">
        <el-button type="primary" plain @click="addAreaClick">
          <i class="icon-add"></i>
          <span>新增</span>
        </el-button>
        <div class="hide-all-area">
          <el-checkbox v-model="hideAll">隐藏所有区域</el-checkbox>
        </div>
      </el-row>
      <div class="dialog-table">
        <el-table :data="tabledata" @selection-change="handleSelectionChange">
          <el-table-column type="selection" align="center" width="60px" />
          <el-table-column prop="areaName" label="名称" align="center" />
          <el-table-column label="操作" align="center" width="110px">
            <template slot-scope="{ row }">
              <el-button size="mini" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination">
        <a href="javascript:;" class="fl">上一页</a>
        <a href="javascript:;" class="fr">下一页</a>
      </div>
    </m-dialog>

    <!-- 弹框-新增 -->
    <m-dialog
      className="add-dialog"
      title="新增"
      :visible.sync="addAreaShow"
      @close="cancel"
    >
      <el-form ref="form" :model="form" label-width="auto">
        <el-form-item label="区域名称" prop="areaName">
          <el-input
            v-model.trim="form.areaName"
            placeholder="请输入区域名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="绘制形状">
          <el-tag
            v-for="(item, index) in shapes"
            :key="index"
            :class="{ active: shapeType === item.type }"
            @click="changeShape(item.type)"
          >
            <img :src="item.shapePath" alt="" />
          </el-tag>
        </el-form-item>
        <el-form-item label="模板下载">
          <el-button>导入坐标</el-button>
        </el-form-item>
        <div class="divider"></div>
        <el-row :gutter="20">
          <el-col :span="13">
            <el-form-item label="边框颜色" prop="borderColorText">
              <el-input v-model="form.borderColorText" disabled>
                <el-color-picker
                  slot="suffix"
                  size="small"
                  v-model="form.borderColorText"
                />
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="边框透明度" prop="areaOutsideOpacity">
              <el-input-number
                style="width: 100%"
                controls-position="right"
                v-model="form.areaOutsideOpacity"
                :min="1"
                :max="100"
              />
              <!-- <el-input v-model.trim="form.areaOutsideOpacity" /> -->
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="边框样式" prop="areaOutsideStyle">
          <el-select
            style="width: 150px"
            v-model="form.areaOutsideStyle"
            placeholder="请选择"
          >
            <el-option label="实线" value="solid" />
            <el-option label="虚线" value="dashed" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="13">
            <el-form-item label="填充颜色" prop="fillColorText">
              <el-input v-model="form.fillColorText" disabled>
                <el-color-picker
                  slot="suffix"
                  size="small"
                  v-model="form.fillColorText"
                />
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="11">
            <el-form-item label="填充透明度" prop="areaInsideOpacity">
              <el-input-number
                style="width: 100%"
                controls-position="right"
                v-model="form.areaInsideOpacity"
                :min="1"
                :max="100"
              />
              <!-- <el-input v-model.trim="form.areaInsideOpacity" /> -->
            </el-form-item>
          </el-col>
        </el-row>
        <div class="divider"></div>
        <el-form-item label-width="0" style="text-align: center">
          <el-button type="primary" @click="save">保存</el-button>
          <el-button type="info" @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </m-dialog>
  </div>
</template>

<script>
import mDialog from '@/components/m-dialog.vue'
import { Vector as LayerVector } from 'ol/layer'
import { Vector as SourceVector } from 'ol/source'
import { Draw } from 'ol/interaction'
import { Style, Stroke, Fill } from 'ol/style'
import { getAreaList, getByRegion, saveArea } from '@/api/index'

export default {
  components: { mDialog },
  data() {
    return {
      alarmModuleShow: false,
      tabledata: [
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' },
        { areaName: 'fd' }
      ],
      pagination: {
        pageNum: 1,
        pageSize: 5,
        pager: 0
      },
      hideAll: false,
      addAreaShow: false,
      form: {
        borderColorText: '#445DA7',
        areaOutsideOpacity: 100,
        areaOutsideStyle: 'solid',
        fillColorText: '#445DA7',
        areaInsideOpacity: 100
      },
      shapes: [
        { type: 'Polygon', shapePath: require('@/assets/image/polygon.png') },
        { type: 'Circle', shapePath: require('@/assets/image/circle.png') }
      ],
      shapeType: '',
      source: new SourceVector(),
      vectorLayer: null,
      interaction: null,
      featureTemp: null,
      areaScope: [],
      areaScopeType: 1,
      radius: ''
    }
  },
  inject: ['getMap'],
  computed: {
    map() {
      return this.getMap()
    }
  },
  mounted() {
    this.getAreaPage()
    this.getYJRegion()
  },
  methods: {
    alarmRegionClick() {
      // console.log(1, this.map)
      this.alarmModuleShow = true
    },
    async getAreaPage() {
      const { pageNum, pageSize } = this.pagination
      const res = await getAreaList({ pageNum, pageSize })
      console.log(res)
    },
    handleSelectionChange() {},
    handleDelete(row) {},
    addAreaClick() {
      this.addAreaShow = true
    },
    changeShape(type) {
      this.shapeType = type
      this.draw(type)
    },
    async getYJRegion() {
      const res = await getByRegion()
      console.log(res)
      this.initVectorLayer()
    },
    // 实例化一个矢量图层Vector作为绘制层
    initVectorLayer() {
      if (this.vectorLayer) return
      this.vectorLayer = new LayerVector({
        source: this.source,
        // 图形绘制完成样式
        style: new Style({
          // 笔触样式
          stroke: new Stroke({
            color: 'green',
            width: 2
          }),
          // 填充样式
          fill: new Fill({
            color: 'crimson'
          })
        }),
        zIndex: 1
      })
      // 将矢量图层加载到 map 中
      this.map.addLayer(this.vectorLayer)
    },
    draw(type) {
      // 重选绘制形状
      if (this.interaction != undefined && this.interaction != null) {
        this.map.removeInteraction(this.interaction)
      }
      this.interaction = new Draw({
        source: this.source,
        // 多边形环或线串完成之前可以绘制的点数。默认情况下没有限制。
        // maxPoints: 5,
        type: type,
        // 图形绘制时样式
        style: new Style({
          stroke: new Stroke({
            width: 2,
            color: 'skyblue'
          }),
          fill: new Fill({
            color: [248, 172, 166, 0.11]
          })
        })
      })
      this.map.addInteraction(this.interaction)

      this.interaction.on('drawstart', (e) => {
        if (this.featureTemp) {
          this.source.removeFeature(this.featureTemp)
        }
      })
      this.interaction.on('drawend', (e) => {
        this.featureTemp = e.feature
        this.areaScopeType = type === 'Polygon' ? 1 : 2

        if (type === 'Polygon') {
          let arr = e.feature
            .clone()
            .getGeometry()
            .transform('EPSG:3857', 'EPSG:4326')
            .getCoordinates()[0]
          console.log('arr=>', arr, e.feature)
          this.areaScope = arr.map((item) => {
            return {
              longitude: item[0],
              latitude: item[1]
            }
          })
          this.radius = ''
        } else {
          // 获取圆心
          let arr = e.feature
            .clone()
            .getGeometry()
            .transform('EPSG:3857', 'EPSG:4326')
            .getCenter()
          this.areaScope = [
            {
              longitude: arr[0],
              latitude: arr[1]
            }
          ]
          console.log('圆心=>', this.areaScope)
          // 获取半径，只有圆才有值
          this.radius = e.feature.getGeometry().getRadius()
          console.log('半径=>', this.radius)
        }
      })
    },
    async save() {
      if (this.interaction != undefined && this.interaction != null) {
        this.map.removeInteraction(this.interaction)
      }
      const { areaScope, areaScopeType, radius } = this
      const params = {
        ...this.form,
        areaScope: JSON.stringify(areaScope),
        areaScopeType,
        radius
      }
      const res = await saveArea(params)
      console.log('save', res)
    },
    cancel() {
      this.shapeType = ''
      if (this.featureTemp) {
        this.source.removeFeature(this.featureTemp)
      }
      if (this.interaction != undefined && this.interaction != null) {
        this.map.removeInteraction(this.interaction)
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.section {
  position: absolute;
  right: 20px;
  bottom: 20px;
  .click-active {
    display: inline-block;
    margin-left: 20px;
    background-size: 100% 100%;
    cursor: pointer;
    &:first-child {
      margin-left: 0;
    }
  }
  .alarm-region {
    width: 38px;
    height: 38px;
    background-image: url('@/assets/image/alarm-region.png');
  }
  .alarm-icon1 {
    width: 47px;
    height: 46px;
    background-image: url('@/assets/image/alarm-icon1.png');
  }
  .alarm-icon2 {
    width: 47px;
    height: 46px;
    background-image: url('@/assets/image/alarm-icon2.png');
  }
}
.region-dialog {
  width: 480px;
  height: 680px;
  padding: 30px 45px;
  background-image: url('@/assets/image/add-bg.png');
  z-index: 4;
}
.add-dialog {
  width: 480px;
  padding: 25px 45px;
  background-image: url('@/assets/image/add-bg.png');
  z-index: 5;
  .divider {
    margin-left: 15px;
    margin-bottom: 25px;
    border-bottom: 1px dashed #007aff;
  }
  :deep(.dialog-body) {
    padding-left: 0;
    padding-right: 16px;
  }
}
/* 按钮样式 */
.el-button {
  i {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 10px;
    background-image: url('@/assets/image/icon-add.png');
    background-size: 100% 100%;
    vertical-align: text-bottom;
  }
  // 功能按钮
  &--primary.is-plain {
    height: 32px;
    padding: 0 12px;
    font-size: 16px;
    border-color: #1acbfe;
    background-color: transparent;
    color: #fff;
    &:focus,
    &:hover {
      color: #fff;
      background: rgba(0, 0, 0, 0.2);
    }
  }
  // 保存
  &--primary {
    height: 32px;
    padding: 0 17px;
    border-radius: 2px;
    background: #007bff;
  }
  // 取消
  &--info {
    height: 32px;
    padding: 0 17px;
    border-radius: 2px;
    background: #99a3ae;
    color: #293038;
    &:focus,
    &:hover {
      color: #293038;
    }
  }
}
.dialog-operation {
  justify-content: space-between;
  align-items: center;
}
.dialog-operation,
.dialog-table {
  margin-bottom: 20px;
}
/* 搜索区域下拉框样式 */
.dialog-operation select {
  min-width: 110px;
  height: 32px;
}
.dialog-operation select option {
  color: #000;
}
/* 搜索区域选项样式 */
.dialog-operation ul {
  display: inline-block;
  margin-left: 20px;
}
.dialog-operation ul li {
  display: inline-block;
  line-height: 32px;
  padding: 0 20px;
  margin-left: 8px;
  border-radius: 4px;
  background-color: #0c2564;
  cursor: pointer;
}
.dialog-operation ul li.active {
  background-color: #195afc;
}
/* 分页 */
.pagination {
  // display: none;
  padding: 0 20px;
  overflow: hidden;
}
.pagination a {
  text-decoration: none;
  color: #fff;
}
.pagination a:active {
  color: rgba(255, 255, 255, 0.8) !important;
}
</style>

<template>
<div class="progress-bar" ref="progressBar">
  <div class="bar-inner">
    <div class="progress" ref="progress"></div>
      <div class="progress-btn-wrapper" @touchstart.prevent="progressTouchStart"
      @touchmove.prevent="progressTouchMove"
      @touchend="progressTouchEnd" ref="btn">
        <div class="progress-btn"></div>
      </div>
  </div>
</div>
</template>

<script type="text/ecmascript-6">
import {prefixStyle} from 'common/js/dom'
const barWidth = 16
const transform = prefixStyle('transform')
export default {
  props: {
    percent: {
      type: Number,
      default: 0
    }
  },
  created() {
    this.touch = {}
  },
  methods: {
    progressTouchStart(e) {
      this.touch.initiated = true
      this.touch.startX = e.touches[0].pageX
      this.touch.left = this.$refs.progress.clientWidth
    },
    progressTouchMove(e) {
      if (!this.touch.initiated) {
        return
      }
      const CurrentWidth = e.touches[0].pageX
      const deltaX = CurrentWidth - this.touch.startX
      const offsetRight = this.touch.left + deltaX
      const offsetWidth = Math.min(this.$refs.progressBar.clientWidth - barWidth, Math.max(0, offsetRight))
      this._pad(offsetWidth)
    },
    progressTouchEnd() {
      this.touch.initiated = false
      this._triggerPercent()
    },
    _pad(offsetWidth) {
      this.$refs.progress.style.width = `${offsetWidth}px`
      this.$refs.btn.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
    },
    _triggerPercent() {
      const barBackgroundWidth = this.$refs.progressBar.clientWidth - barWidth
      const percent = this.$refs.progress.clientWidth / barBackgroundWidth
      this.$emit('percentChange', percent)
    }
  },
  watch: {
    percent(newPercent) {
      if (newPercent >= 0 && !this.touch.initiated) {
        const barBackgroundWidth = this.$refs.progressBar.clientWidth - barWidth
        const offsetWidth = newPercent * barBackgroundWidth
        this._pad(offsetWidth)
      }
    }
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
@import '../../common/stylus/variables'
.progress-bar
  height 30px
  .bar-inner
    position relative
    top 13px
    height 4px
    background rgba(0, 0, 0, 0.3)
    .progress
      position absolute
      height 100%
      background $color-text-d
    .progress-btn-wrapper
      position absolute
      left -8px
      top -13px
      width 30px
      height 30px
      .progress-btn
        position relative
        top 7px
        left 7px
        box-sizing border-box
        width 16px
        height 16px
        border 3px solid $color-text
        border-radius 50%
        background $color-icon-white

</style>

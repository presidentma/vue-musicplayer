<template>
<div class="music-list">
  <div class="back">
    <i class="icon-back" @click="back"></i>
  </div>
  <h1 class="title" v-html="title"></h1>
  <div class="bg-image" :style="bgStyle" ref="bgStyle">
    <div class="filter" ref="filter"></div>
    <div class="play-wrapper">
      <div class="play" v-show="songs.length" ref="play" @click="random">
        <i class="icon-play"></i>
        <span class="text">随机播放全部</span>
      </div>
    </div>
  </div>
  <div class="bg-layer" ref="layer"></div>
  <Scroll :data="songs" class="list" ref="list" :listenScroll="listenScroll" :probeType="probeType" @scroll="scroll">
  <div class="song-list-wrapper">
    <SongList :songs="songs" @select="selectItem"></SongList>
  </div>
  <div class="loading-container" v-show="!songs.length">
    <loading></loading>
  </div>
  </Scroll>
</div>

</template>

<script type="text/ecmascript-6">
import Scroll from '@/base/scroll/scroll'
import SongList from '@/base/song-list/song-list'
import loading from '@/base/loading/loading'
import {mapActions} from 'vuex'
import {prefixStyle} from 'common/js/dom'
const RESRVER_HEIGHT = 40
const Transform = prefixStyle('transform')
const Backdrop = prefixStyle('backdrop-filter')

export default {
  props: {
    bgImage: {
      type: String,
      default: ''
    },
    songs: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      scrollY: 0
    }
  },
  created() {
    this.probeType = 3
    this.listenScroll = true
  },
  mounted() {
    this.imageHeight = this.$refs.bgStyle.clientHeight
    this.mintranslateY = -this.imageHeight + RESRVER_HEIGHT
    this.$refs.list.$el.style.top = `${this.imageHeight}px`
  },
  computed: {
    bgStyle() {
      return `background-image:url(${this.bgImage})`
    }
  },
  components: {
    Scroll,
    SongList,
    loading
  },
  methods: {
    scroll(position) {
      this.scrollY = position.y
    },
    back() {
      this.$router.back()
    },
    selectItem(song, index) {
      this.selectPlay({
        list: this.songs,
        index
      })
    },
    random() {
      this.randomPlay({
        list: this.songs
      })
    },
    ...mapActions([
      'selectPlay',
      'randomPlay'
    ])
  },
  watch: {
    scrollY(newY) {
      let zIndex = 0
      let scale = 1
      let blur = 0
      let translateY = Math.max(this.mintranslateY, newY)
      this.$refs.layer.style[Transform] = `translate3d(0, ${translateY}px, 0)`
      this.$refs.filter.style[Backdrop] = `blur(${blur}px)`
      const precent = Math.abs(newY / this.imageHeight)
      if (newY > 0) {
        scale = 1 + precent
        zIndex = 10
      } else {
        blur = Math.min(20 * precent, 20)
      }
      if (newY < this.mintranslateY) {
        zIndex = 10
        this.$refs.bgStyle.style.paddingTop = 0
        this.$refs.bgStyle.style.height = `${RESRVER_HEIGHT}px`
        this.$refs.play.style.display = 'none'
      } else {
        this.$refs.bgStyle.style.paddingTop = '70%'
        this.$refs.bgStyle.style.height = 0
        this.$refs.play.style.display = ''
      }
      this.$refs.bgStyle.style.zIndex = zIndex
      this.$refs.bgStyle.style[Transform] = `scale(${scale})`
    }
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
@import '../../common/stylus/variables'
@import '../../common/stylus/mixin'
.music-list
  position fixed
  z-index 100
  top 0
  left 0
  bottom 0
  right 0
  background $color-background
  .back
    position absolute
    top 0
    left 6px
    z-index 100
    .icon-back
      display block
      padding 10px
      font-size $font-size-large
      color $color-theme
      text-shadow 0 0 2px rgba(223,178,158,0.9)
  .title
    position absolute
    top 0
    left 10%
    z-index 40
    width 80%
    no-warp()
    text-align center
    line-height 40px
    font-size $font-size-large
    font-weight bold
    color $color-text-ll
  .bg-image
    position relative
    width 100%
    height 0
    padding-top 70%
    transform-origin top
    background-size cover
    .play-wrapper
      position absolute
      bottom 20px
      z-index 50
      width 100%
      .play
        box-sizing border-box
        width 135px
        padding 7px 0
        margin 0 auto
        text-align center
        border 2px solid $color-theme
        color $color-theme
        border-radius 100px
        font-size 0
        .icon-play
          display inline-block
          vertical-align middle
          margin-right 6px
          font-size $font-size-medium-x
        .text
          display inline-block
          vertical-align middle
          font-size $font-size-small
        &.icon-play,.text
          text-shadow: 0 0 10px $color-theme
    .filter
      position absolute
      top 0
      left 0
      width 100%
      height 100%
      background rgba(7, 17, 27, 0.4)
  .bg-layer
    position relative
    height 100%
    background $color-background
  .list
    position fixed
    top 0
    bottom 0
    width 100%
    background $color-background
    .song-list-wrapper
      padding 20px 30px
  .loading-container
    position absolute
    width 100%
    top 50%
    transform translateY(-50%)

</style>

<template>
<transition name="detail">
<MusicList :songs="songs" :title="title" :bg-image="bgImage"></MusicList>
</transition>
</template>

<script type="text/ecmascript-6">
import { mapGetters } from 'vuex'
import { getSingerDatail } from '../../api/singer'
import { createSong } from '../../common/js/song'
import MusicList from 'components/music-list/music-list'
import { ERR_OK } from '../../api/config'

export default {
  data() {
    return {
      songs: []
    }
  },
  created() {
    this._getDatail()
  },
  computed: {
    title() {
      return this.singer.name
    },
    bgImage() {
      return this.singer.avatar
    },
    ...mapGetters([
      'singer'
    ])
  },
  methods: {
    _getDatail() {
      if (!this.singer.id) {
        this.$router.push('/singer')
      }
      getSingerDatail(this.singer.id).then((res) => {
        if (res.code === ERR_OK) {
          this.songs = this._nomalizeSong(res.data.list)
        }
      })
    },
    _nomalizeSong(list) {
      let ret = []
      list.forEach((item) => {
        let {musicData} = item
        if (musicData.songid && musicData.albumid) {
          ret.push(createSong(musicData))
        }
      })
      return ret
    }
  },
  components: {
    MusicList
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus" >
@import '../../common/stylus/variables'


.detail-enter-active,.detail-leave-active
    transition all 0.3s
.detail-enter,.detail-leave-to
    transform translate3d(100%,0,0)
</style>

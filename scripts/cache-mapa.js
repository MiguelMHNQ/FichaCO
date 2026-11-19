// O documento/histórico guarda os arquivos; este cache guarda só recursos decodificados em uso.
class CacheRecursosMapa extends Map {
  delete(src){
    const media=this.get(src);if(!media)return false;
    if(media.dispose)media.dispose();
    else{media.onload=null;media.onerror=null;media.removeAttribute('src');}
    return super.delete(src);
  }
  manter(fontes){for(const src of this.keys())if(!fontes.has(src))this.delete(src);}
  clear(){for(const src of this.keys())this.delete(src);}
}

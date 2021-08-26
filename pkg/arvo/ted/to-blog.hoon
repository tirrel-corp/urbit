/-  spider, store=graph-store
/+  strandio
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand:spider ,vase)
|^
^-  form:m
=+  !<([~ =resource:store =index:store] arg)
;<  =graph:store  bind:m  (scry-graph resource)
?~  index
  !!
=/  =node:store  (got:orm graph i.index)
?.  ?=(%graph -.children.node)
  !!
=/  first-note  (got:orm p.children.node 1)
?.  ?=(%graph -.children.first-note)
  !!
=/  first-revision  (got:orm p.children.first-note 1)
?:  ?=(%| -.post.first-revision)
  !!
=*  post  p.post.first-revision
=/  webpage  (to-webpage post)
~&  `tape`(welp "<!doctype html>" (en-xml:html webpage))
=/  octt  (to-octt webpage)
;<  ~  bind:m
  %+  poke-our:strandio  %file-server
  :-  %file-server-action
  !>  =-  [%serve-glob /nick-blog - %.y]
      ^-  (map path mime)
      %-  ~(gas by *(map path mime))
      :_  ~
      :-  /index/html
      [[%text %html ~] octt]
(pure:m !>(~))
::
++  orm      ((on atom node:store) gth)
::
++  scry-graph
  |=  rid=resource:store
  =/  m  (strand ,graph:store)
  ^-  form:m
  ;<  =update:store  bind:m
    %+  scry:strandio  update:store
    /gx/graph-store/graph/(scot %p entity.rid)/[name.rid]/noun
  ?>  ?=(%add-graph -.q.update)
  (pure:m graph.q.update)
::
++  to-octt
  |=  =manx
  %-  as-octt:mimes:html
  %+  welp
    "<!doctype html>"
  %-  en-xml:html
  manx
::
++  to-webpage
  |=  =post:store
  ^-  manx
  =/  title=content:store  (snag 0 contents.post)
  ?>  ?=(%text -.title)
  =/  body=content:store  (snag 1 contents.post)
  ?>  ?=(%text -.body)
  ;html
    ;head
      ;meta(charset "utf-8");
      ;title: {(trip text.title)} - {(trip (scot %p author.post))}
    ==
    ;body
      ;h2: {(trip text.title)}
      ;pre: {(trip text.body)}
    ==
  ==
::
++  to-webpage-test
  |=  =post:store
  ^-  manx
  ::  ;+  complex expression producing a manx (single element) to marl (list)
  ::      kind of like ~[(some-expression ...)]
  ::  ;/  tape to xml literal
  ::  ;*  complex expression producing a marl
  ::  ;=  form a marl (list), equivalent to :~ in normie hoon
  ::  ;script@"/pay/main.js"; -> '@' sets src attribute on any element
  ::  ; any string -> string literal
  ;html
    ;head
      ;meta(charset "utf-8");
      ;title:'example title'
    ==
    ;body
      ;h2: "example page"
      ; string literal
      ;+  ?:  =(author.post '~bus')
            ;p: 'galaxy'
          ;p: 'not bus'
      ;+  ;/  "asdf"
      ;*  ?:  =(time-sent.post ~2000.1.1)
            ;=  ;p: 'whoa'
                ;h1: 'im old'
              ==
          ;=  ;p: 'whoa it is late'
            ==
    ==
  ==
--


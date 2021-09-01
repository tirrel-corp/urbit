/-  *pipe, store=graph-store
|_  site=website
++  grow
  |%
  ++  noun  site
  ++  pipe-website
    |=  =update:store
    ^-  website
    |^
    ?>  ?=(%add-nodes -.q.update)
    (nodes-to-website nodes.q.update)
    ::
    ++  orm      ((on atom node:store) gth)
    ::
    ++  nodes-to-website
      |=  =(map index node:store)
      ^-  website
      ?>  ?=(^ map)
      =*  node  q.n.map
      ?>  ?=(%graph -.children.node)
      =/  article-revision-container=node:store  (got:orm p.children.node 1)
      ?>  ?=(%graph -.children.article-revision-container)
      =/  latest-revision=(unit [@ node:store])
        (pry:orm p.children.article-revision-container)
      ?~  latest-revision
        !!
      ?>  ?=(%& -.post.+.u.latest-revision)
      %-  ~(gas by *website)
      :_  ~
      :-  /index/html
      :-  [%text %html ~]
      ^-  octs
      %-  as-octt:mimes:html
      %+  welp
        "<!doctype html>"
      %-  en-xml:html
      (to-blog p.post.+.u.latest-revision)
    ::
    ++  to-blog
      |=  =post:store
      ^-  manx
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      =/  body=content:store  (snag 1 contents.post)
      ?>  ?=(%text -.body)
      ;html
        ;head
          ;meta(charset "utf-8");
          ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
          ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
          ;title: {(trip text.title)} - by {(trip (scot %p author.post))}
        ==
        ;body(class "w-100 h-100 flex flex-column items-center")
          ;+  (header-div post)
          ;+  (body-div post)
        ==
      ==
    ::
    ++  header-div
      |=  =post:store
      ^-  manx
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      =/  body=content:store  (snag 1 contents.post)
      ?>  ?=(%text -.body)
      ;div(class "w-100 bb b--black-20 flex justify-center")
        ;div(class "flex w-90 pa3 pl4 pr4 justify-between items-center", style "max-width: 44rem;")
          ;span(class "flex items-center")
            ;p(class "pa2 f5 fw3", style "margin-block-start: 0; margin-block-end: 0;"): Nick Blog
          ==
          ;button(class "f6 pointer fw3 button-reset pa2 bg-black b--none white br2", style "padding: 12px;"): Subscribe
        ==
      ==
    ::
    ++  body-div
      |=  =post:store
      ^-  manx
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      =/  body=content:store  (snag 1 contents.post)
      ?>  ?=(%text -.body)
      ;div(class "pa4 flex flex-column w-90 near-black", style "max-width: 44rem;")
        ;h1(class "f2 lh-title", style "margin-block-end: 0;"): {(trip text.title)}
        ;p(class "f5 gray fw3"): {(trip (cut 3 [0 9] (scot %da time-sent.post)))}
        ;p(class "f4 lh-copy fw3", style "white-space: pre-wrap;"): {(trip text.body)}
      ==
    --
  --
::
++  grab
  |%
  ++  noun  website
  --
::
++  grad  %noun
--

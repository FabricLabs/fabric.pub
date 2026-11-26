'use strict';

const { renderArticle, renderDocument } = require('./document');

const ORIGIN = 'https://fabric.pub';

const SHARED = {
  image: `${ORIGIN}/favicon.svg`,
  stylesheets: ['/site.css']
};

/**
 * Reading versions of the protocol walkthroughs. Script names are the ones
 * `scripts/example-tutorials.js` actually runs in each repository.
 */
const WALKS = [
  {
    slug: 'gossip',
    title: 'How peers talk',
    description: 'How the public Fabric network carries a signed message from neighbor to neighbor without rewriting it.',
    kicker: '01 of 10',
    heading: 'How peers talk',
    subtitle: 'Peers on different computers, carrying signed messages for each other.',
    sections: [
      [
        { h2: 'A network with no center' },
        { p: 'The public Fabric network is not a site you log into. It is programs, called peers, that speak the same protocol. Each peer remembers a few neighbors. Messages hop from neighbor to neighbor. That pattern is gossip.' }
      ],
      [
        { h2: 'You are a key' },
        { p: 'A peer is a key, not a username. When you send a public message, you sign it. Anyone can check the signature. A relay that carries the message does not become the author.' }
      ],
      [
        { h2: 'A hallway, then the square' },
        { p: 'Before gossip, two peers open a TCP connection and wrap it in NOISE. Ping and pong live in that session. Gossip starts once the session is up. The default listen port is 7777.' }
      ],
      [
        { h2: 'A signed envelope' },
        { p: 'A public message is an AMP frame: a 208-byte header, then a body. The header names the author and the message type, and it carries a double-SHA256 of the body. Peers drop a frame whose hash does not match the body, then check the BIP340 signature.' },
        { p: 'When those checks pass, the peer forwards the same bytes. It does not re-sign, and it does not rewrite the message to count the hop. Your signature still verifies after the frame has passed through strangers.' }
      ],
      [
        { h2: 'What is public' },
        { p: 'Some messages are flooded: discovery, a nickname, the shoutbox, a contract namespace, a Bitcoin block tip. The shoutbox, <code>P2P_CHAT_MESSAGE</code>, is cleartext. Every hop can read it. That is the public square.' },
        { p: 'Private delivery does not use that flood. It uses a directed forward, covered later in this path.' }
      ],
      [
        { h2: 'Check it' },
        { p: '<code>examples/fabric-basic-usage.js</code> in <code>@fabric/core</code> signs one chat message, <code>Hello, Fabric.</code>, and verifies it with the same key. A new message has a genesis parent: 32 zero bytes.' },
        { p: '<code>scripts/gossip-relay.js</code> starts one peer that validates and floods. No Hub HTTP, no Bitcoin wallet, and no documents.' },
        { code: 'npm run example:tutorials' }
      ]
    ]
  },
  {
    slug: 'contracts',
    title: 'Application resource contracts',
    description: 'How a Fabric contract is published on the same gossip network: genesis, members, and a spend that cites the tip.',
    kicker: '02 of 10',
    heading: 'Application resource contracts',
    subtitle: 'Gossip moves bytes. A contract is the agreement those bytes refer to.',
    sections: [
      [
        { h2: 'The same envelopes' },
        { p: 'An application resource contract is not a new family of wire types. Three public messages carry it.' },
        {
          list: [
            '<code>CONTRACT_PUBLISH</code> is the genesis.',
            '<code>CONTRACT_MESSAGE</code> is an event inside that namespace. The body names the contract.',
            '<code>CONTRACT_PROPOSAL</code> batches messages, with a Merkle root, a JSON patch, and an optional PSBT.'
          ]
        },
        { p: 'Names such as <code>GroupChat</code> live in the body. They are not outer opcodes.' }
      ],
      [
        { h2: 'The first page sets the rules' },
        { p: 'A genesis names which message types are in bounds, who may read, who may sign, and the threshold, how the tip maps to a Bitcoin Taproot output, and a Bitcoin block hash that ties publication to the chain. An empty list of message types denies every body.' }
      ],
      [
        { h2: 'First writer wins' },
        { p: 'The namespace id comes from that genesis. A second signed genesis for the same id is a different envelope. The register keeps the first.' }
      ],
      [
        { h2: 'Same bytes, same fold' },
        { p: 'Publishers and participants ingest the same signed frame, from the mesh or as a <code>fabric:</code> string. Fold order is the message hash, so arrival order does not pick the winner. That is why a relay has to forward the original bytes. A rewritten frame would make honest copies of the contract diverge.' },
        { p: 'A peer can still flood a <code>CONTRACT_MESSAGE</code> for a namespace it has never opened. Applications ignore ids they do not keep.' }
      ],
      [
        { h2: 'A valid envelope is not enough' },
        { p: 'Anyone can gossip a frame. Changing membership or the spend policy requires the author to already be a signer, or to present a verified sign token for this contract. Chat under the contract is for its readers and signers. It is not the public shoutbox.' },
        { p: 'A withdrawal has to cite the tip\'s state digest and the Bitcoin block hash it claims. A stale binding is refused. A local program run is a commitment to a computation. It does not, by itself, change the Taproot address.' }
      ],
      [
        { h2: 'Where to check the envelope' },
        { p: 'These frames ride the gossip path. The tutorial runner checks a signed envelope, not a full contract fold. That check is <code>examples/fabric-basic-usage.js</code> in <code>@fabric/core</code>.' }
      ]
    ]
  },
  {
    slug: 'messages',
    title: 'Message bodies',
    description: 'How a Fabric message body is a list of typed fields, with a genesis parent and a preimage that stays zero until there is a payment secret.',
    kicker: '03 of 10',
    heading: 'Message bodies',
    subtitle: 'The header says who signed. The body says what they said.',
    sections: [
      [
        { h2: 'A list of fields' },
        { p: 'Each message type that has a schema lists its fields in order. <code>P2P_PING</code> is one field, <code>nonce</code>. The header hash is double-SHA256 of the body bytes. Peers drop a frame whose hash does not match.' }
      ],
      [
        { h2: 'The first frame has no parent' },
        { p: 'The header\'s <code>parent</code> is the id of the previous message, or 32 zero bytes when this frame starts a chain. The sign-and-verify script checks that a new message is still at genesis. Later durable frames set the parent before they sign.' }
      ],
      [
        { h2: 'Zeros until there is a secret' },
        { p: 'The <code>preimage</code> slot is a payment secret. Ordinary public messages leave it as 32 zero bytes. A circuit or an HTLC puts an explicit 32-byte secret there, and the payment hash is SHA256 of that secret. The slot is not a second copy of the body hash.' }
      ],
      [
        { h2: 'Some bodies are just text' },
        { p: '<code>P2P_CHAT_MESSAGE</code> carries UTF-8 with no field schema. That is the shoutbox frame from the first walkthrough.' }
      ],
      [
        { h2: 'JSON lives at HTTP' },
        { p: 'Peers speak fields. Browsers and HTTP speak JSON. <code>@fabric/http</code> is that door: <code>examples/message-bridge.js</code> turns a ping into fields and back, and it stores one sidechain patch as canonical fields while still offering the RFC6902 list to the page. It does not start a server.' },
        { code: 'npm run example:tutorials' }
      ]
    ]
  },
  {
    slug: 'forward',
    title: 'Directed forward',
    description: 'How a Fabric message is addressed to one next hop, so the path stays a line instead of a flood.',
    kicker: '04 of 10',
    heading: 'Directed forward',
    subtitle: 'One next hop at a time, when the square should not hear it.',
    sections: [
      [
        { h2: 'The flood is readable' },
        { p: 'A mesh flood can be read by every hop. That is the right tool for the shoutbox. It is the wrong tool when the path should stay a line.' }
      ],
      [
        { h2: 'The outer layer names one peer' },
        { p: 'A <code>P2P_FORWARD</code> body is the next peer, a time to live, and an inner frame. Only the next hop is named on the outside. The rest of the path is inside the wrap.' }
      ],
      [
        { h2: 'Each hop unwraps once' },
        { p: 'That hop checks that it is the named peer, peels one layer, and finds a smaller forward, or the payload. The time to live counts down. The last inner frame in the tutorial is a signed chat message, <code>hello via onion</code>.' }
      ],
      [
        { h2: 'Check it' },
        { p: '<code>examples/onion-forward.js</code> in <code>@fabric/core</code> builds a two-hop path and peels it. No port is opened. The live path is <code>Peer#sendOnion</code>.' },
        { code: 'node examples/onion-forward.js' }
      ]
    ]
  },
  {
    slug: 'keys',
    title: 'Three keys from one seed',
    description: 'How one Fabric seed splits into an identity, a Bitcoin wallet, and a cosigner, and how a Hub uses that split.',
    kicker: '05 of 10',
    heading: 'Three keys from one seed',
    subtitle: 'The master derives. Applications sign with the children.',
    sections: [
      [
        { h2: 'Identity, wallet, cosigner' },
        { p: 'One seed becomes three keys: a Fabric identity, a Bitcoin wallet, and a BIP87 cosigner. The public keys differ. A signature from one cannot be checked as another.' }
      ],
      [
        { h2: 'The Hub uses the same split' },
        { p: 'A Hub\'s root key only derives. Account 0 on the Hub\'s network yields an identity, for messages and attestations, and a cosigner, for federations and the Beacon. The root public key is a third value. It is not either of those signers.' },
        { p: '<code>examples/operator-keys.js</code> in the Fabric Hub repository checks that split on regtest. The words exist only in memory.' },
        { code: 'node scripts/example-tutorials.js' }
      ]
    ]
  },
  {
    slug: 'passport',
    title: 'Passport sign-in',
    description: 'How a Fabric site issues a Passport challenge for a pinned origin, and how that challenge can be redeemed once.',
    kicker: '06 of 10',
    heading: 'Passport sign-in',
    subtitle: 'Your key answers a challenge from the site your browser is actually on.',
    sections: [
      [
        { h2: 'The site names its own origin' },
        { p: 'Sign in to a Fabric site with your own key. Passport checks that the request comes from the site your browser actually shows. A challenge is issued only for an origin on the relying party\'s list. The <code>Host</code> header does not add one.' }
      ],
      [
        { h2: 'The identity key answers' },
        { p: 'The signer checks that the origin it saw is the origin in the challenge, then signs an assertion with the identity key. The relying party checks the signature, the nonce, and the challenge hash.' }
      ],
      [
        { h2: 'The challenge is spent' },
        { p: 'Redeem takes the stored challenge. The first call opens a session. The public view has the identity and the origin, and it does not carry the session token. The second call finds no challenge left.' },
        { p: 'The HTTP side also keeps a binding secret. The browser holds that secret, so an assertion copied off the page cannot be redeemed on its own.' }
      ],
      [
        { h2: 'Check it' },
        { p: '<code>examples/passport-relying-party.js</code> in <code>@fabric/http</code> pins <code>https://example.com</code>, redeems once, and reads the session view. It does not listen.' },
        { code: 'npm run example:tutorials' }
      ]
    ]
  },
  {
    slug: 'signers',
    title: 'Linked signers',
    description: 'How Passport pairs with a Hub by a six-digit code, and how a grant in a request body is not itself a signature.',
    kicker: '07 of 10',
    heading: 'Linked signers',
    subtitle: 'Compare a code, then grant a scope. A request does not sign by itself.',
    sections: [
      [
        { h2: 'Six digits, both sides' },
        { p: 'Pair Passport with a Hub, or with another signer, by comparing a six-digit code. Compare it before either side grants anything. Each participant keeps its own key.' }
      ],
      [
        { h2: 'A grant is a scope' },
        { p: 'A grant names the other signer and the scopes it covers, such as <code>message</code>. The grant is not a signature on a later request. What the grant allows is decided by signer rules, on the last page of this path.' }
      ],
      [
        { h2: 'Check it' },
        { p: '<code>examples/delegation-body.js</code> in <code>@fabric/http</code> puts a <code>fabric:</code> grant in a JSON body, reads it back, and then refuses the next call once the rate limit is spent. No socket is opened.' },
        { code: 'node examples/delegation-body.js' }
      ]
    ]
  },
  {
    slug: 'federations',
    title: 'Named federations',
    description: 'How several Hubs share one Bitcoin vault, and why the same keys can still have two addresses.',
    kicker: '08 of 10',
    heading: 'Named federations',
    subtitle: 'A descriptor, a threshold, and a vault every member can derive.',
    sections: [
      [
        { h2: 'Who, and how many' },
        { p: 'Several Hubs can form a federation with one shared Bitcoin vault. Nothing is signed without each operator\'s approval. The descriptor names the validators, the threshold, the network, and a publisher who is one of those keys. Its id is a hash of that descriptor, so the order of the validators does not change it.' }
      ],
      [
        { h2: 'Two addresses, same keys' },
        { p: 'The Hub\'s default internal key is <code>nums</code>, so vaults that already hold coins keep their address. The same keys with <code>musig2</code> produce a different address. Coins on the first address stay there until someone sweeps them.' },
        { p: '<code>examples/federation-vault.js</code> checks both addresses for two fresh keys and a threshold of 2, on regtest. Nothing is broadcast, and nothing is scanned.' },
        { code: 'node examples/federation-vault.js' }
      ]
    ]
  },
  {
    slug: 'sidechain',
    title: 'Sidechain and Beacon',
    description: 'How a sidechain patch names the clock and digest it was based on, and what a Beacon epoch seals.',
    kicker: '09 of 10',
    heading: 'Sidechain and Beacon',
    subtitle: 'A document with a clock, and one string for the epoch.',
    sections: [
      [
        { h2: 'A document with a clock' },
        { p: 'Sidechain state is a version, a clock, and content. The digest hashes those three. The same state hashes the same. Two different states do not.' }
      ],
      [
        { h2: 'One patch' },
        { p: 'A patch is an RFC6902 list, the clock it was based on, and the digest from before the change. <code>examples/message-bridge.js</code> in <code>@fabric/http</code> sends one: add <code>/hello</code> with value <code>world</code>, at basis clock 0. The fields keep a canonical copy of that list, and the JSON view offers the same path back. There is no filesystem and no Hub in the script.' },
        { code: 'node examples/message-bridge.js' }
      ],
      [
        { h2: 'The epoch' },
        { p: 'A Beacon epoch seals that kind of state on the Hub\'s clock: the contracts root and the sidechain digest. Validators sign one string for the epoch. That seal is the Beacon\'s own record. It is not an application\'s <code>CONTRACT_MESSAGE</code> traffic.' }
      ]
    ]
  },
  {
    slug: 'edge',
    title: 'The HTTP and Hub edge',
    description: 'Where JSON becomes Fabric fields, how Hub signer rules fail closed, and how a document list price is marked up.',
    kicker: '10 of 10',
    heading: 'The HTTP and Hub edge',
    subtitle: 'JSON at the door. The protocol stays on the other side of it.',
    sections: [
      [
        { h2: 'The bridge' },
        { p: 'HTTP accepts JSON. Core peers speak typed fields. <code>examples/message-bridge.js</code> is that translation for a ping and for a sidechain patch. <code>examples/wire-catalog.js</code> in the Hub repository checks that the Hub\'s names for <code>JSONCall</code> and <code>P2P_CHAT_MESSAGE</code> still match the opcodes in <code>@fabric/core</code>.' }
      ],
      [
        { h2: 'Sign, decline, ask' },
        { p: 'Signer rules sign or decline each request by amount, destination, site, and rate, and they never sign anything they do not clearly allow. A decline wins over a sign for the same scope. A rule with an unknown field is invalid, and while any rule is invalid the Hub asks instead of signing.' },
        { p: 'Every signing decision is logged. A request no rule settles waits for you to approve. A federation withdrawal needs a maximum amount on the sign rule. Without that cap, it is not signed.' },
        { p: '<code>examples/signer-rules.js</code> checks those four outcomes. It does not hold a key.' }
      ],
      [
        { h2: 'A price, then a floor' },
        { p: 'The document-markup script starts from a remote cost and the default markup, 10 percent. A cost of 1000 sats lists at 1100. A price above zero is at least the smallest payment a mainnet HTLC can settle. A cost of zero stays free.' },
        { limit: 'Paid file sales work today on Bitcoin test networks, regtest and signet.' },
        { code: 'node scripts/example-tutorials.js' }
      ]
    ]
  }
];

function walkUrl (slug) {
  return `${ORIGIN}/learn/${slug}.html`;
}

function renderPage (page) {
  const view = Object.assign({}, SHARED, page, {
    article: renderArticle(page)
  });
  return renderDocument(view);
}

function indexSections () {
  return [
    [
      { p: 'A reading path through the local stack. Gossip is how bytes move. The rest is what rides it, who holds the keys, and where HTTP and the Hub sit.' },
      { p: 'Each page below names the offline script that checks it. Run those from a clone of <code>@fabric/core</code>, <code>@fabric/http</code>, or Fabric Hub.' }
    ],
    [
      {
        catalog: WALKS.map((page, index) => ({
          num: String(index + 1).padStart(2, '0'),
          href: `/learn/${page.slug}.html`,
          title: page.heading,
          deck: page.subtitle
        }))
      }
    ],
    [
      { h2: 'Run the checks' },
      { p: 'Each repository has <code>scripts/example-tutorials.js</code>. Every script exits on its own. None of them open a port, and none of them start Bitcoin or Lightning. The repositories require Node.js 26.13.0.' },
      { h3: '@fabric/core' },
      { p: '<code>npm run example:tutorials</code> signs and verifies one chat message, peels a directed forward, builds a collection plus one message, and does an in-memory get and set.' },
      { h3: '@fabric/http' },
      { p: '<code>npm run example:tutorials</code> issues a Passport challenge and redeems it once, translates a ping and a sidechain patch, and reads a <code>fabric:</code> grant from a request body.' },
      { h3: 'Fabric Hub' },
      { p: '<code>node scripts/example-tutorials.js</code> checks the operator keys, the signer rules, the two vault addresses, the document markup, and the wire catalog.' },
      { code: 'npm run example:tutorials' }
    ]
  ];
}

function learnDocuments () {
  const index = {
    title: 'Protocol walkthroughs',
    url: `${ORIGIN}/learn/`,
    path: '/learn/',
    description: 'Ten reading walkthroughs for Fabric, from gossip to the HTTP and Hub edge, plus the offline scripts that check them.',
    heading: 'Protocol walkthroughs',
    subtitle: 'First pictures of the local stack. The scripts are the check.',
    sections: indexSections()
  };

  const documents = [
    {
      file: 'assets/learn/index.html',
      path: index.path,
      html: renderPage(index)
    }
  ];

  WALKS.forEach((page, index) => {
    const next = WALKS[index + 1];
    const sections = page.sections.concat([[
      {
        next: next
          ? { href: `/learn/${next.slug}.html`, label: `Next: ${next.heading}` }
          : { href: '/learn/', label: 'All walkthroughs' }
      }
    ]]);
    const full = Object.assign({}, page, {
      url: walkUrl(page.slug),
      path: `/learn/${page.slug}.html`,
      title: `${page.title} · Fabric`,
      sections
    });
    documents.push({
      file: `assets/learn/${page.slug}.html`,
      path: full.path,
      html: renderPage(full)
    });
  });

  return documents;
}

module.exports = {
  WALKS,
  learnDocuments
};

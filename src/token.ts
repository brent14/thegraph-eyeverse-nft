import { ipfs, json, JSONValue, log } from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
  Token as TokenContract,
} from "../generated/Token/Token";
import { Token, User } from "../generated/schema";

const ipfshash = "QmTng7uDc2Ls9SXuPphjCHCqLjRScBqAPvno3f6UtvspxC";

export function handleTransfer(event: TransferEvent): void {
  /* load the token from the existing Graph Node */
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    /* if the token does not yet exist, create it */
    token = new Token(event.params.tokenId.toString());
    token.tokenID = event.params.tokenId;

    token.tokenURI = "/" + event.params.tokenId.toString();

    /* combine the ipfs hash and the token ID to fetch the token metadata from IPFS */
    let metadata = ipfs.cat(ipfshash + token.tokenURI);
    if (metadata) {
      const value = json.fromBytes(metadata).toObject();
      if (value) {
        /* using the metatadata from IPFS, update the token object with the values  */
        const image = value.get("image");
        const name = value.get("name");
        const description = value.get("description");
        const externalURL = value.get("external_url");

        if (name) {
          token.name = name.toString();
          token.ipfsURI = "ipfs.io/ipfs/" + ipfshash + token.tokenURI;
        }

        if (image) {
          token.image = image.toString();
        }

        if (externalURL) {
          token.externalURL = externalURL.toString();
        }

        if (description) {
          token.description = description.toString();
        }

        const compiler = value.get("compiler");
        if (compiler) {
          token.compiler = compiler.toString();
        }

        // this needs to be fixed

        let eyeAttributes = value.get("attributes");
        let attributes: JSONValue[];

        if (eyeAttributes) {
          attributes = eyeAttributes.toArray();

          log.info("eye attributes", ["was read"]);

          for (let i = 0; i < attributes.length; i++) {
            let item = attributes[i].toObject();
            let trait: string;
            let traitName = item.get("trait_type");

            if (traitName) {
              trait = traitName.toString();
              let value: string;
              let traitValue = item.get("value");

              log.info("eye attributes", ["for loops was entered"]);
              if (traitValue) {
                value = traitValue.toString();
                if (trait == "Blessing") {
                  token.blessing = value;
                }
                if (trait == "Back") {
                  token.back = value;
                }
                if (trait == "Character") {
                  token.character = value;
                }
                if (trait == "Head") {
                  token.head = value;
                }
                if (trait == "Front") {
                  token.front = value;
                }
              }
            }
          }
        }
      }
    }
  }
  token.updatedAtTimestamp = event.block.timestamp;

  /* set or update the owner field and save the token to the Graph Node */
  token.owner = event.params.to.toHexString();
  token.save();

  /* if the user does not yet exist, create them */
  let user = User.load(event.params.to.toHexString());
  if (!user) {
    user = new User(event.params.to.toHexString());
    user.save();
  }
}

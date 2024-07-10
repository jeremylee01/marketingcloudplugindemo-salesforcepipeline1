import { LightningElement, track, wire } from "lwc";
import { MessageContext, publish } from "lightning/messageService";
import { CurrentPageReference } from "lightning/navigation";

import getSystemPropertiesFromPipelineOfUserStory from "@salesforce/apex/SystemProperties.getSystemPropertiesFromPipelineOfUserStory";
import COMMIT_PAGE_COMMUNICATION_CHANNEL from '@salesforce/messageChannel/copado__CommitPageCommunication__c';


export default class UserStoryCommitTableActions extends LightningElement {
    @track hasFlow = false;

    @wire(MessageContext)
    _context;

    recordId;
    _changes;
    _sourceMemberAvailableChecked = true;
    _listOfMetadataTypesAvailable = true;
    _filtered = [];

    _SFMC_METADATA = "SFMC_METADATA_ITEMS";

    @wire(CurrentPageReference)
    getParameters(pageReference) {
        if (pageReference && pageReference.state) {
            this.recordId = pageReference.state.copado__recordId;
        }
    }

    connectedCallback() {
    }

    async renderedCallback() {
        try{

            let arr = [];
            let properties = await getSystemPropertiesFromPipelineOfUserStory({
                userStoryId: this.recordId,
                names: [this._SFMC_METADATA]
            });
            console.debug('UserStoryCommitTableActions', JSON.stringify(properties));
            if(!properties[this._SFMC_METADATA]) {
                console.warn('copado_sfmc marketing cloud: There is no property defined in the pipeline:', this._SFMC_METADATA);
                return;
            }
            const metadatas = properties[this._SFMC_METADATA].trim().split(/\r?\n/g);
            for(let metadata of metadatas) {
                metadata = (metadata||'').trim();
                arr.push({
                    Operation: 'Add',
                    MemberType: 'json',
                    Directory: 'folder1',
                    MemberName: metadata,
                    Category: 'mcmetadata',
                    LastModifiedDate: '',
                    LastModifiedByName: '',
                });
            }

            const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
            await sleep(1000) // pause for 1 second, to let the page load before sending the message

            const payload = {
                type: 'retrievedChanges',
                value: arr
            };
            publish(this._context, COMMIT_PAGE_COMMUNICATION_CHANNEL, payload);
        }catch(e) {
            console.error( 'Problem initializing', e);
        }
    }
}
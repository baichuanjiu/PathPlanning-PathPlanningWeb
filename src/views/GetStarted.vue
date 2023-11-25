<script setup lang="ts">
import ButtonWithPrefixIcon from '@/components/buttons/ButtonWithPrefixIcon.vue'
import { ref } from 'vue';
import axios from "axios";
import { Pixel } from '@/models/Pixel';
import { Coordinate } from '@/models/Coordinate';
import { OpenNode } from '@/models/OpenNode';

const hasUploadedImage = ref(false)
const hasGotResult = ref(false)
const roadExtraction = async (e: Event) => {
    try {
        const target = e.target as HTMLInputElement
        await axios({
            url: '/roadExtraction',
            method: 'post',
            data: {
                file: target.files![0]
            },
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            responseType: 'blob',
        }).then((res) => {
            hasGotResult.value = true;
            let blob = new Blob([res.data], { type: "image/png" })
            let img = document.getElementById('result-image') as HTMLImageElement
            img!.src = URL.createObjectURL(blob)
        })
    } catch (error) {
        console.log('Error')
    }
}
const uploadImagePreview = (e: Event) => {
    const target = e.target as HTMLInputElement
    hasUploadedImage.value = true
    window.setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight)
    }, 100)
    let img = document.getElementById('upload-image') as HTMLImageElement
    img!.src = URL.createObjectURL(target.files![0])
    hasGotResult.value = false;
    roadExtraction(e)
}
const downloadResultImage = () => {
    let img = document.getElementById('result-image') as HTMLImageElement
    let downloadLink = document.createElement('a')
    downloadLink.download = 'result-image'
    downloadLink.style.display = 'none'
    downloadLink.href = img!.src
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
}

const showPathPlanningArea = ref(false)
const dispalyOriginalImage = ref(true)
let pixelsMatrix = <Pixel[][]>([])
let pendingPixelsArray = <Coordinate[]>([])
let field = 1
let selectedField = 0
const selectedPointsArray = ref<Coordinate[]>([])
let isSelectedInvalid = ref(false)
let roadNetworkPoints = <Coordinate[]>([])
const finalDistance = ref(0)
const hasPlanned = ref(false)
const getRoadNetwork = async () => {
    try {
        let img = document.getElementById('result-image') as HTMLImageElement
        let originalImage = document.getElementById('original-image') as HTMLCanvasElement
        originalImage.width = 1024;
        originalImage.height = 1024;
        let imageContext = originalImage!.getContext("2d", { willReadFrequently: true })
        imageContext!.drawImage(img, 0, 0)
        await axios({
            url: '/roadNetworkConstruction',
            method: 'post',
            data: originalImage.toDataURL().toString(),
            headers: {
                'Content-Type': 'application/json'
            },
        }).then((res) => {
            roadNetworkPoints = res.data as Coordinate[]
        })
    } catch (error) {
        console.log('Error')
    }
}
const initPathPlanningArea = async () => {
    await getRoadNetwork()
    showPathPlanningArea.value = true

    let upload = document.getElementById('upload-image') as HTMLImageElement
    let result = document.getElementById('result-image') as HTMLImageElement

    let originalImage = document.getElementById('original-image') as HTMLCanvasElement
    originalImage.width = 1024;
    originalImage.height = 1024;
    let imageContext = originalImage!.getContext("2d", { willReadFrequently: true })
    imageContext!.drawImage(upload, 0, 0)

    for (let i = 0; i < roadNetworkPoints.length; i++) {
        let temp = 0
        temp = roadNetworkPoints[i].x
        roadNetworkPoints[i].x = roadNetworkPoints[i].y
        roadNetworkPoints[i].y = temp
        imageContext!.beginPath()
        imageContext!.lineWidth = 3
        imageContext!.strokeStyle = '#ff0000'
        imageContext!.arc(roadNetworkPoints[i].x, roadNetworkPoints[i].y, 6, 0, Math.PI * 2)
        imageContext!.stroke()
        imageContext!.closePath()
    }

    let Matrix = document.getElementById('pixels-Matrix') as HTMLCanvasElement
    Matrix.width = 1024;
    Matrix.height = 1024;
    let MatrixContext = Matrix!.getContext("2d", { willReadFrequently: true })
    MatrixContext!.drawImage(result, 0, 0)
    let data = MatrixContext!.getImageData(0, 0, 1024, 1024).data
    for (let i = 0; i < 1024; i++) {
        let pixelsRow = []
        for (let j = 0; j < 1024; j++) {
            pixelsRow[j] = new Pixel(data[(j * 1024 + i) * 4])
        }
        pixelsMatrix[i] = pixelsRow
    }
    for (let i = 0; i < 1024; i++) {
        for (let j = 0; j < 1024; j++) {
            if (pixelsMatrix[i][j].color == 255) {
                let depth = 1;
                let weight = 1;
                while (true) {
                    if (i - depth >= 0 && j - depth >= 0) {
                        if (pixelsMatrix[i - depth][j - depth].color == 0) {
                            break;
                        }
                    }
                    if (i - depth >= 0) {
                        if (pixelsMatrix[i - depth][j].color == 0) {
                            break;
                        }
                    }
                    if (i - depth >= 0 && j + depth < 1024) {
                        if (pixelsMatrix[i - depth][j + depth].color == 0) {
                            break;
                        }
                    }
                    if (j - depth >= 0) {
                        if (pixelsMatrix[i][j - depth].color == 0) {
                            break;
                        }
                    }
                    if (j + depth < 1024) {
                        if (pixelsMatrix[i][j + depth].color == 0) {
                            break;
                        }
                    }
                    if (i + depth < 1024 && j - depth >= 0) {
                        if (pixelsMatrix[i + depth][j - depth].color == 0) {
                            break;
                        }
                    }
                    if (i + depth < 1024) {
                        if (pixelsMatrix[i + depth][j].color == 0) {
                            break;
                        }
                    }
                    if (i + depth < 1024 && j + depth < 1024) {
                        if (pixelsMatrix[i + depth][j + depth].color == 0) {
                            break;
                        }
                    }
                    depth++
                    if (depth % 2 == 0) {
                        weight += 2
                    }
                }
                pixelsMatrix[i][j].weight = weight;
            }
            if (pixelsMatrix[i][j].color == 255 && pixelsMatrix[i][j].field == 0) {
                pendingPixelsArray.push(new Coordinate(i, j))
                while (pendingPixelsArray.length != 0) {
                    let i = pendingPixelsArray[0].x
                    let j = pendingPixelsArray[0].y
                    infectField(i, j)
                    pendingPixelsArray.splice(0, 1)
                }
                field++
            }
        }
    }
}
const infectField = (i: number, j: number) => {
    if (pixelsMatrix[i][j].color == 255 && pixelsMatrix[i][j].field == 0) {
        pixelsMatrix[i][j].field = field
    }
    if (i - 1 >= 0 && j - 1 >= 0) {
        if (pixelsMatrix[i - 1][j - 1].color == 255 && pixelsMatrix[i - 1][j - 1].field == 0) {
            pixelsMatrix[i - 1][j - 1].field = field
            pendingPixelsArray.push(new Coordinate(i - 1, j - 1))
        }
    }
    if (i - 1 >= 0) {
        if (pixelsMatrix[i - 1][j].color == 255 && pixelsMatrix[i - 1][j].field == 0) {
            pixelsMatrix[i - 1][j].field = field
            pendingPixelsArray.push(new Coordinate(i - 1, j))
        }
    }
    if (i - 1 >= 0 && j + 1 < 1024) {
        if (pixelsMatrix[i - 1][j + 1].color == 255 && pixelsMatrix[i - 1][j + 1].field == 0) {
            pixelsMatrix[i - 1][j + 1].field = field
            pendingPixelsArray.push(new Coordinate(i - 1, j + 1))
        }
    }
    if (j - 1 >= 0) {
        if (pixelsMatrix[i][j - 1].color == 255 && pixelsMatrix[i][j - 1].field == 0) {
            pixelsMatrix[i][j - 1].field = field
            pendingPixelsArray.push(new Coordinate(i, j - 1))
        }
    }
    if (j + 1 < 1024) {
        if (pixelsMatrix[i][j + 1].color == 255 && pixelsMatrix[i][j + 1].field == 0) {
            pixelsMatrix[i][j + 1].field = field
            pendingPixelsArray.push(new Coordinate(i, j + 1))
        }
    }
    if (i + 1 < 1024 && j - 1 >= 0) {
        if (pixelsMatrix[i + 1][j - 1].color == 255 && pixelsMatrix[i + 1][j - 1].field == 0) {
            pixelsMatrix[i + 1][j - 1].field = field
            pendingPixelsArray.push(new Coordinate(i + 1, j - 1))
        }
    }
    if (i + 1 < 1024) {
        if (pixelsMatrix[i + 1][j].color == 255 && pixelsMatrix[i + 1][j].field == 0) {
            pixelsMatrix[i + 1][j].field = field
            pendingPixelsArray.push(new Coordinate(i + 1, j))
        }
    }
    if (i + 1 < 1024 && j + 1 < 1024) {
        if (pixelsMatrix[i + 1][j + 1].color == 255 && pixelsMatrix[i + 1][j + 1].field == 0) {
            pixelsMatrix[i + 1][j + 1].field = field
            pendingPixelsArray.push(new Coordinate(i + 1, j + 1))
        }
    }
}
const getClickPixel = (e: MouseEvent) => {
    let pixelPosition = {
        x: e.offsetX,
        y: e.offsetY
    };
    let originalImage = document.getElementById('original-image') as HTMLCanvasElement
    let imageContext = originalImage!.getContext("2d", { willReadFrequently: true })

    let Matrix = document.getElementById('pixels-Matrix') as HTMLCanvasElement
    let MatrixContext = Matrix!.getContext("2d", { willReadFrequently: true })

    for (let i = 0; i < roadNetworkPoints.length; i++) {
        let distance = Math.sqrt(Math.pow(pixelPosition.x - roadNetworkPoints[i].x, 2) + Math.pow(pixelPosition.y - roadNetworkPoints[i].y, 2))
        if (distance < 6) {
            pixelPosition.x = roadNetworkPoints[i].x
            pixelPosition.y = roadNetworkPoints[i].y
            break
        }
    }

    if (pixelsMatrix[pixelPosition.x][pixelPosition.y].color == 0) {
        let depth = 1
        while (depth < 10) {
            if (pixelPosition.x - depth >= 0 && pixelPosition.y - depth >= 0) {
                if (pixelsMatrix[pixelPosition.x - depth][pixelPosition.y - depth].color == 255) {
                    pixelPosition.x = pixelPosition.x - depth
                    pixelPosition.y = pixelPosition.y - depth
                    break
                }
            }
            if (pixelPosition.x - depth >= 0) {
                if (pixelsMatrix[pixelPosition.x - depth][pixelPosition.y].color == 255) {
                    pixelPosition.x = pixelPosition.x - depth
                    pixelPosition.y = pixelPosition.y
                    break
                }
            }
            if (pixelPosition.x - depth >= 0 && pixelPosition.y + depth < 1024) {
                if (pixelsMatrix[pixelPosition.x - depth][pixelPosition.y + depth].color == 255) {
                    pixelPosition.x = pixelPosition.x - depth
                    pixelPosition.y = pixelPosition.y + depth
                    break
                }
            }
            if (pixelPosition.y - depth >= 0) {
                if (pixelsMatrix[pixelPosition.x][pixelPosition.y - depth].color == 255) {
                    pixelPosition.x = pixelPosition.x
                    pixelPosition.y = pixelPosition.y - depth
                    break
                }
            }
            if (pixelPosition.y + depth < 1024) {
                if (pixelsMatrix[pixelPosition.x][pixelPosition.y + depth].color == 255) {
                    pixelPosition.x = pixelPosition.x
                    pixelPosition.y = pixelPosition.y + depth
                    break
                }
            }
            if (pixelPosition.x + depth < 1024 && pixelPosition.y - depth >= 0) {
                if (pixelsMatrix[pixelPosition.x + depth][pixelPosition.y - depth].color == 255) {
                    pixelPosition.x = pixelPosition.x + depth
                    pixelPosition.y = pixelPosition.y - depth
                    break
                }
            }
            if (pixelPosition.x + depth < 1024) {
                if (pixelsMatrix[pixelPosition.x + depth][pixelPosition.y].color == 255) {
                    pixelPosition.x = pixelPosition.x + depth
                    pixelPosition.y = pixelPosition.y
                    break
                }
            }
            if (pixelPosition.x + depth < 1024 && pixelPosition.y + depth < 1024) {
                if (pixelsMatrix[pixelPosition.x + depth][pixelPosition.y + depth].color == 255) {
                    pixelPosition.x = pixelPosition.x + depth
                    pixelPosition.y = pixelPosition.y + depth
                    break
                }
            }
            depth++
        }
    }

    let pixel = MatrixContext!.getImageData(pixelPosition.x, pixelPosition.y, 1, 1).data
    if (pixel[0] == 255) {
        if (selectedField == 0) {
            selectedField = pixelsMatrix[pixelPosition.x][pixelPosition.y].field
            selectedPointsArray.value.push(new Coordinate(pixelPosition.x, pixelPosition.y))
            isSelectedInvalid.value = false
        }
        else if (pixelsMatrix[pixelPosition.x][pixelPosition.y].field == selectedField) {
            selectedPointsArray.value.push(new Coordinate(pixelPosition.x, pixelPosition.y))
            isSelectedInvalid.value = false
        }
        else {
            isSelectedInvalid.value = true
        }
        if (!isSelectedInvalid.value) {

            imageContext!.beginPath()
            imageContext!.fillStyle = '#00ff00'
            imageContext!.arc(pixelPosition.x, pixelPosition.y, 9, 0, Math.PI * 2)
            imageContext!.fill()
            imageContext!.closePath()

            let imageData = MatrixContext!.getImageData(0, 0, 1024, 1024)

            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x - 1)) * 4] = 255
            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x - 1)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x - 1)) * 4 + 2] = 0

            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x)) * 4] = 255
            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x)) * 4 + 2] = 0

            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x + 1)) * 4] = 255
            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x + 1)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y - 1) * 1024 + (pixelPosition.x + 1)) * 4 + 2] = 0

            imageData.data[((pixelPosition.y) * 1024 + (pixelPosition.x - 1)) * 4] = 255
            imageData.data[((pixelPosition.y) * 1024 + (pixelPosition.x - 1)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y) * 1024 + (pixelPosition.x - 1)) * 4 + 2] = 0

            imageData.data[(pixelPosition.y * 1024 + pixelPosition.x) * 4] = 255
            imageData.data[(pixelPosition.y * 1024 + pixelPosition.x) * 4 + 1] = 0
            imageData.data[(pixelPosition.y * 1024 + pixelPosition.x) * 4 + 2] = 0

            imageData.data[((pixelPosition.y) * 1024 + (pixelPosition.x + 1)) * 4] = 255
            imageData.data[((pixelPosition.y) * 1024 + (pixelPosition.x + 1)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y) * 1024 + (pixelPosition.x + 1)) * 4 + 2] = 0

            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x - 1)) * 4] = 255
            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x - 1)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x - 1)) * 4 + 2] = 0

            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x)) * 4] = 255
            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x)) * 4 + 2] = 0

            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x + 1)) * 4] = 255
            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x + 1)) * 4 + 1] = 0
            imageData.data[((pixelPosition.y + 1) * 1024 + (pixelPosition.x + 1)) * 4 + 2] = 0
            MatrixContext!.putImageData(imageData, 0, 0)
        }
    }
    else {
        isSelectedInvalid.value = true
    }
}
const backToRoadExtraction = () => {
    showPathPlanningArea.value = false
    pixelsMatrix = []
    pendingPixelsArray = []
    field = 1
    selectedField = 0
    selectedPointsArray.value = []
    isSelectedInvalid.value = false
    roadNetworkPoints = []
    finalDistance.value = 0
    hasPlanned.value = false
}
const resetSelectedState = () => {
    selectedField = 0
    selectedPointsArray.value = []
    isSelectedInvalid.value = false
    finalDistance.value = 0
    hasPlanned.value = false

    let upload = document.getElementById('upload-image') as HTMLImageElement
    let originalImage = document.getElementById('original-image') as HTMLCanvasElement
    originalImage.width = 1024;
    originalImage.height = 1024;
    let imageContext = originalImage!.getContext("2d", { willReadFrequently: true })
    imageContext!.drawImage(upload, 0, 0)
    for (let i = 0; i < roadNetworkPoints.length; i++) {
        imageContext!.beginPath()
        imageContext!.lineWidth = 3
        imageContext!.strokeStyle = '#ff0000'
        imageContext!.arc(roadNetworkPoints[i].x, roadNetworkPoints[i].y, 6, 0, Math.PI * 2)
        imageContext!.stroke()
        imageContext!.closePath()
    }

    let result = document.getElementById('result-image') as HTMLImageElement
    let Matrix = document.getElementById('pixels-Matrix') as HTMLCanvasElement
    Matrix.width = 1024;
    Matrix.height = 1024;
    let MatrixContext = Matrix!.getContext("2d", { willReadFrequently: true })
    MatrixContext!.drawImage(result, 0, 0)
}
const pathPlanning = () => {
    for (let i = 0; i < selectedPointsArray.value.length - 1; i++) {
        AStarAlgorithm(selectedPointsArray.value[i], selectedPointsArray.value[i + 1])
    }
}
const AStarAlgorithm = (start: Coordinate, destination: Coordinate) => {
    let startPoint = new Coordinate(start.x, start.y)
    let destinationPoint = new Coordinate(destination.x, destination.y)
    let i = startPoint.x
    let j = startPoint.y
    let g = 0
    let open = [] as OpenNode[]
    let openSet = new Set()
    let close = new Set()
    let passedPointsArray = [] as Coordinate[]
    const search = (pending_i: number, pending_j: number) => {
        if (pixelsMatrix[pending_i][pending_j].color == 255 && !openSet.has(pixelsMatrix[pending_i][pending_j]) && !close.has(pixelsMatrix[pending_i][pending_j])) {
            let temp_next_i = pending_i
            let temp_next_j = pending_j
            let temp_g = g + Math.sqrt(Math.pow(temp_next_i - i, 2) + Math.pow(temp_next_j - j, 2))
            let distance = calculateDistance(temp_g, new Coordinate(temp_next_i, temp_next_j), destinationPoint)
            let copyPassedState = passedPointsArray.concat()
            copyPassedState.push(new Coordinate(temp_next_i, temp_next_j))
            open.push(new OpenNode(new Coordinate(temp_next_i, temp_next_j), distance, copyPassedState))
            openSet.add(pixelsMatrix[pending_i][pending_j])
        }
    }
    openSet.add(pixelsMatrix[i][j])
    while (i != destinationPoint.x || j != destinationPoint.y) {
        close.add(pixelsMatrix[i][j])
        openSet.delete(pixelsMatrix[i][j])
        let minDistance = -1
        let next_i = -1
        let next_j = -1
        if (i - 1 >= 0 && j - 1 >= 0) {
            search(i - 1, j - 1)
        }
        if (i - 1 >= 0) {
            search(i - 1, j)
        }
        if (i - 1 >= 0 && j + 1 < 1024) {
            search(i - 1, j + 1)
        }
        if (j - 1 >= 0) {
            search(i, j - 1)
        }
        if (j + 1 < 1024) {
            search(i, j + 1)
        }
        if (i + 1 < 1024 && j - 1 >= 0) {
            search(i + 1, j - 1)
        }
        if (i + 1 < 1024) {
            search(i + 1, j)
        }
        if (i + 1 < 1024 && j + 1 < 1024) {
            search(i + 1, j + 1)
        }
        let n = 0
        for (let k = 0; k < open.length; k++) {
            minDistance = open[0].distance
            n = 0
            if (minDistance > open[k].distance) {
                n = k
                minDistance = open[k].distance
            }
        }
        next_i = open[n].point.x
        next_j = open[n].point.y
        passedPointsArray = open[n].passedState.concat()
        let distance = Math.sqrt(Math.pow(destination.x - next_i, 2) + Math.pow(destination.y - next_j, 2))
        g = minDistance - distance + (pixelsMatrix[next_i][next_j].weight * 8)
        open.splice(n, 1)
        i = next_i
        j = next_j
        passedPointsArray.push(new Coordinate(i, j))
    }
    repaintPath(passedPointsArray)
}
const calculateDistance = (g: number, position: Coordinate, destination: Coordinate): number => {
    let distance = Math.sqrt(Math.pow(destination.x - position.x, 2) + Math.pow(destination.y - position.y, 2))
    return g + distance - (pixelsMatrix[position.x][position.y].weight * 8)
}
const repaintPath = (path: Coordinate[]) => {
    let originalImage = document.getElementById('original-image') as HTMLCanvasElement
    let imageContext = originalImage!.getContext("2d", { willReadFrequently: true })
    let imageData = imageContext!.getImageData(0, 0, 1024, 1024)

    let Matrix = document.getElementById('pixels-Matrix') as HTMLCanvasElement
    let MatrixContext = Matrix!.getContext("2d", { willReadFrequently: true })
    let MatrixData = MatrixContext!.getImageData(0, 0, 1024, 1024)
    for (let k = 0; k < path.length; k++) {
        imageData.data[(path[k].y * 1024 + path[k].x) * 4] = 255
        imageData.data[(path[k].y * 1024 + path[k].x) * 4 + 1] = 0
        imageData.data[(path[k].y * 1024 + path[k].x) * 4 + 2] = 0
        MatrixData.data[(path[k].y * 1024 + path[k].x) * 4] = 255
        MatrixData.data[(path[k].y * 1024 + path[k].x) * 4 + 1] = 0
        MatrixData.data[(path[k].y * 1024 + path[k].x) * 4 + 2] = 0
    }
    let distance = 0
    for (let k = 0; k < path.length - 1; k++) {
        distance += Math.sqrt(Math.pow(path[k + 1].x - path[k].x, 2) + Math.pow(path[k + 1].y - path[k].y, 2))
    }
    finalDistance.value = distance
    hasPlanned.value = true
    imageContext!.putImageData(imageData, 0, 0)
    MatrixContext!.putImageData(MatrixData, 0, 0)
}
</script>

<template>
    <div class="main-area">
        <div class="aside">
            <p class="description on-surface-text display-medium">
                Welcome
            </p>
            <p class="description on-surface-text body-large">
                Our team use a pretrained and improved D-LinkNet model for road extraction. After <b>spending 29 hours
                    and
                    training for 184 epochs</b> ( batch size is 4, train set image number is 6226 ) , the loss of the
                model
                reaches <b>0.21</b> and performs well on the test set.
            </p>
            <p class="description on-surface-text body-large">
                Now you can use our website to upload 1024*1024 resolution images and experience the amazing accuracy of
                our <b>D-LinkNet model</b>.
            </p>
            <p class="description on-surface-text body-large">
                After you have experienced our road extraction service, <b>click on the result image</b>, we also
                provide a path planning service using
                the <b>A-Star algorithm</b>.
            </p>
            <p class="description on-surface-text display-small">
                You can also
            </p>
            <a href="static/log/log01_dlink34.log" target="_blank">
                <div class="custom-button">
                    <span
                        class="custom-button-icon material-icons-outlined md-36 on-secondary-container-text">print</span>
                    <span class="custom-button-label title-large on-secondary-container-text">View Trainning Log</span>
                </div>
            </a>
            <a href="static/pdf/D-LinkNet_LinkNet_with_Pretrained_Encoder_and_Dilated_Convolution_for_High_Resolution_Satellite_Imagery_Road_Extraction.pdf"
                target="_blank">
                <div class="custom-button">
                    <span
                        class="custom-button-icon material-icons-outlined md-36 on-secondary-container-text">description</span>
                    <span class="custom-button-label title-large on-secondary-container-text">Read D-LinkNet
                        Paper</span>
                </div>
            </a>
            <div class="custom-button">
                <span
                    class="custom-button-icon material-icons-outlined md-36 on-secondary-container-text">question_answer</span>
                <span class="custom-button-label title-large on-secondary-container-text">Feedback To Us</span>
            </div>
        </div>
        <div class="workspace">
            <div class="upload-area" :style="{ display: (showPathPlanningArea ? 'none' : 'inline') }">
                <div class="image-area">
                    <img id="upload-image" class="placeholder-box"
                        :style="{ display: (hasUploadedImage ? 'inline' : 'none') }" />
                    <div class="placeholder-box" v-if="!hasUploadedImage">
                        <div class="show-area-description-container tertiary-container">
                            <p class="description on-tertiary-container-text headline-small">You can upload a 1024
                                *
                                1024 resolution
                                image by clicking the button below.</p>
                        </div>
                    </div>
                </div>
                <div class="button-area">
                    <label>
                        <ButtonWithPrefixIcon icon="file_upload" label="Upload" type="elevated"></ButtonWithPrefixIcon>
                        <input type="file" style="display: none;" accept="image/*" @change="uploadImagePreview">
                    </label>
                </div>
            </div>
            <div class="result-area" v-if="hasUploadedImage"
                :style="{ display: (showPathPlanningArea ? 'none' : 'inline') }">
                <div class="image-area">
                    <img id="result-image" class="placeholder-box"
                        :style="{ display: (hasGotResult ? 'inline' : 'none') }" @click="initPathPlanningArea" />
                    <div class="placeholder-box" v-if="!hasGotResult">
                        <div class="show-area-description-container tertiary-container">
                            <p class="description on-surface-text headline-small">We are extracting the
                                road
                                in the image, it may take a while.</p>
                        </div>
                    </div>
                </div>
                <div class="button-area">
                    <ButtonWithPrefixIcon icon="file_download" label="Download" type="elevated" v-if="hasGotResult"
                        @click="downloadResultImage()">
                    </ButtonWithPrefixIcon>
                    <ButtonWithPrefixIcon icon="file_download" label="Download" type="elevated" isDisabled v-else>
                    </ButtonWithPrefixIcon>
                </div>
            </div>
            <div class="planning-area" :style="{ display: (showPathPlanningArea ? 'flex' : 'none') }">
                <div class="navigation-button-area">
                    <ButtonWithPrefixIcon icon="arrow_back" label="Back" type="filled-tonal"
                        @click="backToRoadExtraction">
                    </ButtonWithPrefixIcon>
                    <p class="description on-surface-text body-large" v-if="isSelectedInvalid">The point you just chose
                        is invalid</p>
                    <ButtonWithPrefixIcon icon="swap_horiz" label="Toggle Display Mode" type="text"
                        @click="dispalyOriginalImage = !dispalyOriginalImage">
                    </ButtonWithPrefixIcon>
                </div>
                <div class="path-planning-area">
                    <canvas id="original-image" @click="getClickPixel"
                        :style="{ display: (dispalyOriginalImage ? '' : 'none') }">
                    </canvas>
                    <canvas id="pixels-Matrix" @click="getClickPixel"
                        :style="{ display: (dispalyOriginalImage ? 'none' : '') }">
                    </canvas>
                </div>
                <div class="operators-area">
                    <ButtonWithPrefixIcon icon="restart_alt" label="Reset" type="elevated" isDisabled
                        v-if="selectedPointsArray.length == 0">
                    </ButtonWithPrefixIcon>
                    <ButtonWithPrefixIcon icon="restart_alt" label="Reset" type="elevated" @click="resetSelectedState"
                        v-else>
                    </ButtonWithPrefixIcon>
                    <p class="description on-surface-text body-large" v-if="!hasPlanned">You have chosen {{
                            selectedPointsArray.length
                    }}
                        points.</p>
                    <p class="description on-surface-text body-large" v-else>Final distance: {{ finalDistance }}</p>
                    <ButtonWithPrefixIcon icon="route" label="Path Planning" type="elevated" isDisabled
                        v-if="selectedPointsArray.length <= 1">
                    </ButtonWithPrefixIcon>
                    <ButtonWithPrefixIcon icon="route" label="Path Planning" type="elevated" @click="pathPlanning"
                        v-else>
                    </ButtonWithPrefixIcon>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use '@/assets/SCSS/layout';
@use '@/assets/SCSS/icon-size';

@mixin default-margin() {
    margin: 5px 5px 5px 5px;
}

@mixin default-border() {
    border-radius: 16px;
    border: 6px solid var(--md-sys-color-outline);
}

@mixin show-area() {
    @include default-margin();
    @include default-border();
    height: 500px;
    width: 400px;
    padding: 0px 50px 0px 50px;
    display: flex;
    flex-wrap: wrap;
}

.main-area {
    display: flex;
    height: calc(100% - 65px);
    width: 100%;
}

.aside {
    height: calc(100% - 50px);
    width: 400px;
    overflow-y: auto;
    border-right: 1px solid var(--md-sys-color-outline);
    padding: 25px 50px 25px 50px;
}

.description {
    font-family: 'Roboto';
}

.custom-button {
    background-color: var(--md-sys-color-secondary-container);
    cursor: pointer;
    transition: all 0.4s ease-in-out;
    @include layout.flex-portrait-center();
    border-radius: 25px;
    border: 0;
    height: 80px;
    padding-left: 16px;
    padding-right: 24px;
}

a {
    text-decoration: none;
}

a+a .custom-button {
    margin-top: 12px;
}

a+.custom-button {
    margin-top: 12px;
}

.custom-button:hover {
    background-color: rgba($color: var(--md-sys-color-secondary-container-rgb), $alpha: 0.08);
    box-shadow: 2px 2px 4px #7b7b7b,
        -2px -2px 4px #ffffff;
}

.custom-button :not(:last-child) {
    margin-right: 8px;
}

.custom-button-label {
    font-family: 'Roboto';
}

.workspace {
    height: calc(100% - 50px);
    width: calc(100% - 600px);
    overflow-y: auto;
    flex-wrap: wrap;
    justify-content: space-around;
    @include layout.flex-portrait-center();
    padding: 25px 50px 25px 50px;
}

.upload-area {
    @include show-area();
}

.result-area {
    @include show-area();
}

.planning-area {
    max-width: 1028px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
}

#result-image {
    cursor: pointer;
}

.placeholder-box {
    @include layout.flex-center();
    height: 350px;
    width: 350px;
    border-radius: 15px;
}

.show-area-description-container {
    @include layout.flex-center();
    padding: 0px 10px 0px 10px;
    border-radius: 15px;
}

.image-area {
    height: 85%;
    width: 100%;
    @include layout.flex-center();
}

.button-area {
    height: 15%;
    width: 100%;
    @include layout.flex-center();
}

.navigation-button-area {
    margin-bottom: 12px;
    width: 100%;
    min-height: 52px;
    @include layout.flex-portrait-center();
    justify-content: space-between;
    flex-wrap: wrap;
}

.path-planning-area {
    aspect-ratio: 1 / 1;
    overflow: auto;
    width: 100%;
    margin-bottom: 12px;
}

.operators-area {
    @include layout.flex-portrait-center();
    width: 100%;
    justify-content: space-around;
    flex-wrap: wrap;
}

@media screen and (max-width: 1150px) {
    .main-area {
        flex-wrap: wrap;
    }

    .aside {
        height: auto;
        width: 100%;
        border-right: none;
    }

    .workspace {
        height: auto;
        width: 100%;
        padding: 25px 25px 25px 25px;
    }
}

@media screen and (max-width: 500px) {
    .workspace {
        overflow-x: hidden;
    }
}
</style>
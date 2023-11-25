<script setup lang="ts">
defineProps({
    isSelected: Boolean,
    isDisabled: Boolean,
    icon: String,
    label: String,
    type: String,
})
</script>

<template>
    <div class="button-with-prefix-icon" :class="[isDisabled ? 'elevated-button-disabled' : 'elevated-button']"
        v-if="type === 'elevated'">
        <span class="icon material-icons-outlined md-18 primary-text">{{ icon }}</span>
        <span class="label label-large primary-text">{{ label }}</span>
    </div>
    <div class="button-with-prefix-icon" :class="[isDisabled ? 'filled-button-disabled' : 'filled-button']"
        v-else-if="type === 'filled'">
        <span class="icon material-icons-outlined md-18 on-primary-text">{{ icon }}</span>
        <span class="label label-large on-primary-text">{{ label }}</span>
    </div>
    <div class="button-with-prefix-icon" :class="[isDisabled ? 'filled-tonal-button-disabled' : 'filled-tonal-button']"
        v-else-if="type === 'filled-tonal'">
        <span class="icon material-icons-outlined md-18 on-secondary-container-text">{{ icon }}</span>
        <span class="label label-large on-secondary-container-text">{{ label }}</span>
    </div>
    <div class="button-with-prefix-icon" :class="[isDisabled ? 'outlined-button-disabled' : 'outlined-button']"
        v-else-if="type === 'outlined'">
        <span class="icon material-icons-outlined md-18 primary-text">{{ icon }}</span>
        <span class="label label-large primary-text">{{ label }}</span>
    </div>
    <div class="button-with-prefix-icon"
        :class="[isDisabled ? 'text-button-disabled' : 'text-button', { 'text-button-selected': isSelected }]"
        v-else>
        <span class="icon md-18"
            :class="[isSelected ? 'on-primary-text' : 'on-surface-text', isSelected ? 'material-icons' : 'material-icons-outlined']">{{
                    icon
            }}</span>
        <span class="label label-large" :class="[isSelected ? 'on-primary-text' : 'on-surface-text']">{{ label }}</span>
    </div>
</template>

<style lang="scss" scoped>
@use '@/assets/SCSS/layout';
@use '@/assets/SCSS/icon-size';

@mixin button-disabled() {
    cursor: not-allowed;
    background-color: rgba($color: var(--md-sys-color-on-surface-rgb), $alpha: 0.12);

    .icon {
        color: rgba($color: var(--md-sys-color-on-surface-rgb), $alpha: 0.38);
    }

    .label {
        color: rgba($color: var(--md-sys-color-on-surface-rgb), $alpha: 0.38);
    }
}

.button-with-prefix-icon {
    cursor: pointer;
    transition: all 0.4s ease-in-out;
    @include layout.flex-portrait-center();
    border-radius: 50px;
    border: 0;
    height: 40px;
    padding-left: 16px;
    padding-right: 24px;
}

.elevated-button {
    background-color: var(--md-sys-color-surface);
    box-shadow: 2px 2px 4px #7b7b7b,
        -2px -2px 4px #ffffff;
}

.elevated-button:hover {
    background-color: rgba($color: var(--md-sys-color-primary-rgb), $alpha: 0.08);
}

.elevated-button-disabled {
    @include button-disabled();
}

.filled-button {
    background-color: var(--md-sys-color-primary);
}

.filled-button:hover {
    box-shadow: 2px 2px 4px #7b7b7b,
        -2px -2px 4px #ffffff;
}

.filled-button-disabled {
    @include button-disabled();
}

.filled-tonal-button {
    background-color: var(--md-sys-color-secondary-container);
}

.filled-tonal-button:hover {
    background-color: rgba($color: var(--md-sys-color-secondary-container-rgb), $alpha: 0.08);
    box-shadow: 2px 2px 4px #7b7b7b,
        -2px -2px 4px #ffffff;
}

.filled-tonal-button-disabled {
    @include button-disabled();
}

.outlined-button {
    background-color: var(--md-sys-color-surface);
    border: 1px solid var(--md-sys-color-outline);
}

.outlined-button:hover {
    background-color: rgba($color: var(--md-sys-color-primary-rgb), $alpha: 0.08);
    border: 1px solid var(--md-sys-color-outline);
}

.outlined-button-disabled {
    @include button-disabled();
}

.text-button {
    background-color: var(--md-sys-color-surface);
}

.text-button:hover {
    box-shadow: 2px 2px 4px #7b7b7b,
        -2px -2px 4px #ffffff;
}

.text-button-selected {
    background-color: var(--md-sys-color-primary);
}

.text-button-disabled {
    @include button-disabled();
    background-color: var(--md-sys-color-surface);
}

.button-with-prefix-icon :not(:last-child) {
    margin-right: 8px;
}

.label {
    font-family: 'Roboto';
}
</style>
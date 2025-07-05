<template>
  <VContainer fluid>
    <BrutalistCard max-width="600">
      <template #title>
        <span>Welcome to Smart CRID</span>
      </template>
      <template #text>
        <p>
          CRID (Certificado de Requisição de Inscrição em Disciplinas) is a tool for managing
          students and professors in the context of academic course enrollment.
        </p>
        <p>
          This tool streamlines the enrollment process and provides a centralized platform for
          managing academic records.
        </p>

        <VForm>
          <VTextField
            label="Search for courses or professors"
            prepend-icon="mdi-magnify"
            variant="outlined"
            class="mt-4"
          />
          <BrutalistButton
            class="mt-2"
            color="primary"
            variant="outlined"
            prepend-icon="mdi-magnify"
            @click="() => alert('Search functionality not implemented yet')"
          >
            Search
          </BrutalistButton>
        </VForm>
      </template>
      <template #actions>
        <BrutalistButton prependIcon="mdi-hand-pointing-right" to="/enrollment">
          Start Enrollment
        </BrutalistButton>
        <BrutalistButton prependIcon="mdi-information" to="/about">
          About Smart CRID </BrutalistButton
        >
      </template>
    </BrutalistCard>
  </VContainer>
</template>

<script>
import BrutalistCard from '@/components/BrutalistCard.vue'
import BrutalistButton from '@/components/BrutalistButton.vue'

export default {
  name: 'HomePage',
  components: {
    BrutalistCard,
    BrutalistButton,
  },
}
</script>
